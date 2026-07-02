/**
 * POST /api/admin/invite
 * Invites a new committee member via Supabase Auth.
 * Only callable by admin-role users.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('sb-access-token')?.value;
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const db = getAdminClient();

  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401);

  const { data: callerProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || callerProfile.role !== 'admin') {
    return json({ error: 'Forbidden — admin only' }, 403);
  }

  const body = await request.json();
  const { email, name, title, role = 'committee' } = body as {
    email: string;
    name?: string;
    title?: string;
    role?: string;
  };

  if (!email) return json({ error: 'email is required' }, 400);

  // Invite the user via Supabase Admin
  const { data: invited, error: inviteErr } = await db.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name ?? email.split('@')[0], role },
    redirectTo: `${new URL(request.url).origin}/admin`,
  });

  if (inviteErr) return json({ error: inviteErr.message }, 400);

  // Upsert profile with name and title
  if (invited?.user?.id) {
    await db.from('profiles').upsert({
      id:        invited.user.id,
      email,
      full_name: name ?? email.split('@')[0],
      title:     title ?? null,
      role,
    });
  }

  return json({ ok: true, userId: invited?.user?.id });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
