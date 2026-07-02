/**
 * POST /api/admin/permissions
 * Saves the full permission set for one committee member.
 * Only callable by admin-role users.
 *
 * Body: { userId: string, permissions: [{ page, can_view, can_edit }] }
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

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return json({ error: 'Forbidden — admin only' }, 403);
  }

  const body = await request.json();
  const { userId, permissions } = body as {
    userId: string;
    permissions: { page: string; can_view: boolean; can_edit: boolean }[];
  };

  if (!userId || !Array.isArray(permissions)) {
    return json({ error: 'userId and permissions array required' }, 400);
  }

  // Delete existing permissions for this user then re-insert
  const { error: delErr } = await db
    .from('admin_permissions')
    .delete()
    .eq('user_id', userId);

  if (delErr) return json({ error: delErr.message }, 500);

  // Only insert rows where at least can_view is true
  const rows = permissions
    .filter(p => p.can_view || p.can_edit)
    .map(p => ({
      user_id:  userId,
      page:     p.page,
      can_view: p.can_view,
      // can_edit implies can_view
      can_edit: p.can_edit,
    }));

  if (rows.length > 0) {
    const { error: insErr } = await db.from('admin_permissions').insert(rows);
    if (insErr) return json({ error: insErr.message }, 500);
  }

  return json({ ok: true, saved: rows.length });
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
