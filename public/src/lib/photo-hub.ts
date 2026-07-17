/**
 * Wallaroo FC Media Hub — shared helpers for the contributor photo pipeline.
 *
 * SMS-code login, session cookies, and Twilio outbound sending. Everything runs
 * server-side under the Supabase service-role key, so no anon RLS is needed —
 * we own every code path that touches these tables.
 */
import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';
import { getAdminClient } from './supabase';

// ── Config ─────────────────────────────────────────────────────────────
const CODE_TTL_MINUTES    = 10;
const SESSION_TTL_HOURS   = 24;
const CODE_MAX_ATTEMPTS   = 5;
export const SESSION_COOKIE_NAME = 'wfc-photo-session';

/** Normalise a raw mobile number to E.164 assuming an Australian default. */
export function normaliseMobile(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;                  // already E.164
  if (digits.startsWith('0') && digits.length === 10) return `+61${digits.slice(1)}`;  // AU mobile
  if (digits.startsWith('61') && digits.length === 11) return `+${digits}`;
  if (digits.length === 9)   return `+61${digits}`;           // rare, without leading 0
  return null;
}

/** Constant-time compare two hex-encoded sha256 hashes. */
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Six-digit code, cryptographic random. */
function generateCode(): string {
  // 0..999999 uniform. randomInt is uniform over [min, max).
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

/** 32-byte URL-safe token; hashed for storage. */
function generateSessionToken(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(32).toString('base64url');
  return { plain, hash: sha256(plain) };
}

// ── SMS sending ────────────────────────────────────────────────────────
/**
 * Send the SMS via Twilio if configured, otherwise log to stderr. In dev the
 * code prints so it can still be exercised without a Twilio account; the API
 * response never contains the code either way.
 */
async function sendSms(mobile: string, message: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sid   = import.meta.env.TWILIO_ACCOUNT_SID  as string | undefined;
  const token = import.meta.env.TWILIO_AUTH_TOKEN   as string | undefined;
  const from  = import.meta.env.TWILIO_FROM_NUMBER  as string | undefined;

  if (!sid || !token || !from) {
    // Dev / not-yet-configured — log to server console; never surface to client.
    console.warn(`[photo-hub] SMS not configured. Would send to ${mobile}: ${message}`);
    return { ok: true };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const body = new URLSearchParams({ From: from, To: mobile, Body: message });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method:  'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('[photo-hub] Twilio send failed', res.status, txt);
    return { ok: false, error: `Twilio ${res.status}` };
  }
  return { ok: true };
}

// ── Public API ─────────────────────────────────────────────────────────

/** Request a 6-digit code for a mobile number.  Rate-limited by mobile. */
export async function requestLoginCode(rawMobile: string, ip: string | null): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const mobile = normaliseMobile(rawMobile);
  if (!mobile) return { ok: false, error: 'That mobile number does not look right.' };
  const admin = getAdminClient();

  // Rate limit: no more than 3 code requests in the last hour for the same mobile.
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await admin.from('photo_login_codes')
    .select('id', { count: 'exact', head: true })
    .eq('mobile', mobile).gte('created_at', hourAgo);
  if ((count ?? 0) >= 3) {
    return { ok: false, error: 'Too many code requests. Please wait an hour and try again.' };
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString();
  const { error } = await admin.from('photo_login_codes').insert({
    mobile, code_hash: sha256(code), expires_at: expiresAt, requested_ip: ip,
  });
  if (error) return { ok: false, error: 'Could not send code. Please try again.' };

  const send = await sendSms(mobile, `Your Wallaroo FC upload code: ${code}\nValid for ${CODE_TTL_MINUTES} minutes. Do not share.`);
  if (!send.ok) return { ok: false, error: 'Could not deliver SMS. Please try again shortly.' };
  return { ok: true };
}

/**
 * Verify a submitted code. On success:
 *  - Marks the code row used
 *  - Upserts a contributor for that mobile
 *  - Creates a session token and returns the plaintext for cookie setting
 */
export async function verifyLoginCode(
  rawMobile: string, code: string, meta: { ip: string | null; ua: string | null },
): Promise<
  { ok: true; contributorId: string; sessionToken: string; sessionExpiresAt: string; isFirstLogin: boolean }
  | { ok: false; error: string }
> {
  const mobile = normaliseMobile(rawMobile);
  if (!mobile) return { ok: false, error: 'That mobile number does not look right.' };
  if (!/^\d{6}$/.test(code)) return { ok: false, error: 'Enter the six-digit code from the SMS.' };

  const admin = getAdminClient();
  const now = new Date().toISOString();
  const codeHash = sha256(code);

  // Find the newest matching, unused, unexpired code for this mobile.
  const { data: rows } = await admin.from('photo_login_codes')
    .select('id, code_hash, expires_at, used_at, attempts')
    .eq('mobile', mobile)
    .is('used_at', null)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row) return { ok: false, error: 'That code has expired. Request a new one.' };
  if (row.attempts >= CODE_MAX_ATTEMPTS) {
    return { ok: false, error: 'Too many attempts. Request a new code.' };
  }

  if (row.code_hash !== codeHash) {
    await admin.from('photo_login_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
    return { ok: false, error: 'That code was not correct.' };
  }

  await admin.from('photo_login_codes').update({ used_at: now }).eq('id', row.id);

  // Upsert contributor
  const { data: existing } = await admin.from('photo_contributors').select('id').eq('mobile', mobile).maybeSingle();
  let contributorId = existing?.id;
  let isFirstLogin = false;
  if (!contributorId) {
    const { data: inserted, error } = await admin.from('photo_contributors')
      .insert({ mobile, last_login_at: now })
      .select('id').single();
    if (error) return { ok: false, error: 'Could not create contributor account.' };
    contributorId = inserted!.id;
    isFirstLogin = true;
  } else {
    await admin.from('photo_contributors').update({ last_login_at: now }).eq('id', contributorId);
  }

  // Issue session
  const { plain: sessionToken, hash: tokenHash } = generateSessionToken();
  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000).toISOString();
  const { error: sErr } = await admin.from('photo_contributor_sessions').insert({
    contributor_id: contributorId, token_hash: tokenHash,
    expires_at: sessionExpiresAt, ip: meta.ip, user_agent: meta.ua,
  });
  if (sErr) return { ok: false, error: 'Could not create session.' };

  return { ok: true, contributorId: contributorId!, sessionToken, sessionExpiresAt, isFirstLogin };
}

/** Look up the contributor for a session cookie.  Returns null if none / expired. */
export async function getSession(cookies: AstroCookies): Promise<{
  id: string; contributorId: string; mobile: string; full_name: string | null;
} | null> {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const admin = getAdminClient();
  const tokenHash = sha256(token);
  const now = new Date().toISOString();
  const { data } = await admin.from('photo_contributor_sessions')
    .select('id, contributor_id, contributor:photo_contributors(mobile, full_name)')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .maybeSingle();
  if (!data) return null;
  const contributor: any = data.contributor;
  return {
    id: data.id,
    contributorId: data.contributor_id,
    mobile: contributor?.mobile ?? '',
    full_name: contributor?.full_name ?? null,
  };
}

/** Revoke the current session (logout). */
export async function revokeSession(cookies: AstroCookies): Promise<void> {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;
  const admin = getAdminClient();
  await admin.from('photo_contributor_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', sha256(token));
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/** Set the session cookie after a successful verify. */
export function setSessionCookie(cookies: AstroCookies, sessionToken: string, expiresAt: string) {
  cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    path:     '/',
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    expires:  new Date(expiresAt),
  });
}
