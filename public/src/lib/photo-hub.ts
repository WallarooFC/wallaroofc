/**
 * Wallaroo FC Media Hub — shared helpers for the contributor photo pipeline.
 *
 * Email + password login (scrypt-hashed).  Session cookies stored server-side
 * in `photo_contributor_sessions`.  Everything runs under the Supabase
 * service-role key, so no anon RLS is needed.
 */
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import type { AstroCookies } from 'astro';
import { getAdminClient } from './supabase';

// ── Config ─────────────────────────────────────────────────────────────
const SESSION_TTL_HOURS   = 24;
export const SESSION_COOKIE_NAME = 'wfc-photo-session';
const SCRYPT_N = 16384;
const SCRYPT_KEYLEN = 64;
const SALT_LEN  = 16;

const scrypt = promisify(crypto.scrypt) as (
  password: string, salt: Buffer, keylen: number, options?: crypto.ScryptOptions,
) => Promise<Buffer>;

// ── Hashing ────────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LEN);
  const key = await scrypt(plain, salt, SCRYPT_KEYLEN, { N: SCRYPT_N });
  // scrypt$N$salt(hex)$hash(hex)
  return `scrypt$${SCRYPT_N}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored?.startsWith('scrypt$')) return false;
  const parts = stored.split('$');
  if (parts.length !== 4) return false;
  const N = parseInt(parts[1], 10);
  const salt = Buffer.from(parts[2], 'hex');
  const expected = Buffer.from(parts[3], 'hex');
  const actual = await scrypt(plain, salt, expected.length, { N });
  return crypto.timingSafeEqual(expected, actual);
}

// ── Sessions ───────────────────────────────────────────────────────────
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
function generateSessionToken(): { plain: string; hash: string } {
  const plain = crypto.randomBytes(32).toString('base64url');
  return { plain, hash: sha256(plain) };
}

/** Case-insensitive email normalization. */
export function normaliseEmail(raw: string): string | null {
  const trimmed = (raw ?? '').trim().toLowerCase();
  if (!trimmed) return null;
  // Simple RFC 5322-ish sanity check; sufficient for our workflow.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Attempt to sign in.  Returns a session token on success.
 */
export async function login(
  emailRaw: string,
  password: string,
  meta: { ip: string | null; ua: string | null },
): Promise<
  { ok: true; contributorId: string; sessionToken: string; sessionExpiresAt: string }
  | { ok: false; error: string }
> {
  const email = normaliseEmail(emailRaw);
  if (!email) return { ok: false, error: 'Enter a valid email address.' };
  if (!password) return { ok: false, error: 'Enter your password.' };

  const admin = getAdminClient();
  const { data: contributor } = await admin.from('photo_contributors')
    .select('id, password_hash, is_active, is_approved, full_name, email')
    .ilike('email', email)
    .maybeSingle();

  // Vague error to avoid leaking whether an account exists.
  const badLogin = { ok: false as const, error: 'Email or password is not correct.' };
  if (!contributor || !contributor.password_hash) return badLogin;
  const passOk = await verifyPassword(password, contributor.password_hash);
  if (!passOk) return badLogin;
  if (!contributor.is_active)   return { ok: false, error: 'This account is not active.  Please contact the committee.' };
  if (!contributor.is_approved) return { ok: false, error: 'Your contributor account is awaiting approval by the committee.' };

  const { plain: sessionToken, hash: tokenHash } = generateSessionToken();
  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000).toISOString();
  const { error: sErr } = await admin.from('photo_contributor_sessions').insert({
    contributor_id: contributor.id, token_hash: tokenHash,
    expires_at: sessionExpiresAt, ip: meta.ip, user_agent: meta.ua,
  });
  if (sErr) return { ok: false, error: 'Could not create session.' };

  await admin.from('photo_contributors')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', contributor.id);

  return { ok: true, contributorId: contributor.id, sessionToken, sessionExpiresAt };
}

/** Look up the contributor for a session cookie.  Returns null if none / expired. */
export async function getSession(cookies: AstroCookies): Promise<{
  id: string; contributorId: string; email: string; full_name: string | null;
} | null> {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const admin = getAdminClient();
  const tokenHash = sha256(token);
  const now = new Date().toISOString();
  const { data } = await admin.from('photo_contributor_sessions')
    .select('id, contributor_id, contributor:photo_contributors(email, full_name)')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .maybeSingle();
  if (!data) return null;
  const contributor: any = data.contributor;
  return {
    id: data.id,
    contributorId: data.contributor_id,
    email: contributor?.email ?? '',
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

/** Set the session cookie after a successful login. */
export function setSessionCookie(cookies: AstroCookies, sessionToken: string, expiresAt: string) {
  cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    path:     '/',
    httpOnly: true,
    secure:   true,
    sameSite: 'lax',
    expires:  new Date(expiresAt),
  });
}
