import type { APIRoute } from 'astro';
import { getAdminClient, supabase } from '../../../lib/supabase';

export const prerender = false;

async function getRole(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const token = cookie.match(/sb-access-token=([^;]+)/)?.[1];
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) return { role: null, userId: null };
  const { data: profile } = await getAdminClient()
    .from('profiles').select('role').eq('id', data.user.id).single();
  return { role: profile?.role ?? null, userId: data.user.id };
}

const WRITE_ROLES = ['admin', 'secretary', 'president', 'treasurer'];

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Accept both JSON and form-encoded posts (the inline delete forms POST as
// application/x-www-form-urlencoded so they work without JS).
async function readBody(request: Request): Promise<Record<string, any>> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    return await request.json().catch(() => ({}));
  }
  const form = await request.formData();
  const obj: Record<string, any> = {};
  form.forEach((v, k) => { obj[k] = v.toString(); });
  return obj;
}

export const POST: APIRoute = async ({ request, redirect }) => {
  const auth = await getRole(request);
  if (!auth?.role || !WRITE_ROLES.includes(auth.role)) {
    return json({ ok: false, error: 'Unauthorized' }, 401);
  }
  const userId = auth.userId;

  const body = await readBody(request);
  const action = body.action;
  const memberId = body.member_id;
  if (!action) return json({ ok: false, error: 'action required' }, 400);
  if (!memberId) return json({ ok: false, error: 'member_id required' }, 400);

  const admin = getAdminClient();
  const isFormPost = !(request.headers.get('content-type') ?? '').includes('application/json');
  const redirectTo = `/admin/sponsor-register/${memberId}?saved=${action.startsWith('delete') ? 'deleted' : action.includes('contact') ? 'contact' : 'activity'}`;

  // ── Contacts ────────────────────────────────────────────────────────────
  if (action === 'add_contact') {
    const { error } = await admin.from('sponsor_contacts').insert({
      member_id:  memberId,
      full_name:  body.full_name,
      role:       body.role || null,
      email:      body.email || null,
      phone:      body.phone || null,
      is_primary: body.is_primary === true || body.is_primary === 'on' || body.is_primary === 'true',
      notes:      body.notes || null,
    });
    if (error) return json({ ok: false, error: error.message }, 500);
    return isFormPost ? redirect(redirectTo, 303) : json({ ok: true });
  }

  if (action === 'delete_contact') {
    if (!body.id) return json({ ok: false, error: 'id required' }, 400);
    const { error } = await admin.from('sponsor_contacts').delete().eq('id', body.id).eq('member_id', memberId);
    if (error) return json({ ok: false, error: error.message }, 500);
    return isFormPost ? redirect(redirectTo, 303) : json({ ok: true });
  }

  // ── Activities ──────────────────────────────────────────────────────────
  if (action === 'add_activity') {
    if (!body.activity_type || !body.summary || !body.activity_date) {
      return json({ ok: false, error: 'activity_type, summary and activity_date are required' }, 400);
    }
    const { error } = await admin.from('sponsor_activities').insert({
      member_id:      memberId,
      activity_type:  body.activity_type,
      activity_date:  body.activity_date,
      summary:        body.summary,
      details:        body.details || null,
      contact_person: body.contact_person || null,
      outcome:        body.outcome || null,
      follow_up_date: body.follow_up_date || null,
      created_by:     userId,
    });
    if (error) return json({ ok: false, error: error.message }, 500);
    return isFormPost ? redirect(redirectTo, 303) : json({ ok: true });
  }

  if (action === 'delete_activity') {
    if (!body.id) return json({ ok: false, error: 'id required' }, 400);
    const { error } = await admin.from('sponsor_activities').delete().eq('id', body.id).eq('member_id', memberId);
    if (error) return json({ ok: false, error: error.message }, 500);
    return isFormPost ? redirect(redirectTo, 303) : json({ ok: true });
  }

  return json({ ok: false, error: 'Unknown action' }, 400);
};
