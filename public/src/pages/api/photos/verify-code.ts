import type { APIRoute } from 'astro';
import { verifyLoginCode, setSessionCookie } from '../../../lib/photo-hub';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const body = await request.json().catch(() => null) as { mobile?: string; code?: string } | null;
  if (!body?.mobile || !body?.code) {
    return new Response(JSON.stringify({ ok: false, error: 'Mobile and code are required.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const ua = request.headers.get('user-agent');
  const result = await verifyLoginCode(body.mobile, body.code, { ip: clientAddress ?? null, ua });
  if (!result.ok) {
    return new Response(JSON.stringify(result), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  setSessionCookie(cookies, result.sessionToken, result.sessionExpiresAt);
  return new Response(JSON.stringify({
    ok: true,
    contributorId: result.contributorId,
    isFirstLogin:  result.isFirstLogin,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
