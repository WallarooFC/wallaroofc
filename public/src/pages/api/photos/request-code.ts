import type { APIRoute } from 'astro';
import { requestLoginCode } from '../../../lib/photo-hub';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const body = await request.json().catch(() => null) as { mobile?: string } | null;
  if (!body?.mobile) {
    return new Response(JSON.stringify({ ok: false, error: 'Mobile number is required.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const result = await requestLoginCode(body.mobile, clientAddress ?? null);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
