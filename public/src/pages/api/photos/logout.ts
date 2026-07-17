import type { APIRoute } from 'astro';
import { revokeSession } from '../../../lib/photo-hub';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  await revokeSession(cookies);
  return redirect('/photos/upload', 303);
};
