import type { APIRoute } from 'astro';
import { login, setSessionCookie } from '../../../lib/photo-hub';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  if (!body?.email || !body?.password) {
    return new Response(JSON.stringify({ ok: false, error: 'Email and password are required.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const ua = request.headers.get('user-agent');
  const result = await login(body.email, body.password, { ip: clientAddress ?? null, ua });
  if (!result.ok) {
    return new Response(JSON.stringify(result), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  setSessionCookie(cookies, result.sessionToken, result.sessionExpiresAt);
  return new Response(JSON.stringify({ ok: true, contributorId: result.contributorId }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
