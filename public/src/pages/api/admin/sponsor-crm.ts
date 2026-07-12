import type { APIRoute } from 'astro';
import { getAdminClient, supabase } from '../../../lib/supabase';

export const prerender = false;

async function getAuth(request: Request) {
  const cookie = request.headers.get('cookie') ?? '';
  const token = cookie.match(/sb-access-token=([^;]+)/)?.[1];
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  if (!data?.user) return null;
  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles').select('role, full_name').eq('id', data.user.id).single();
  if (!profile) return null;

  // Anyone marked admin has global write.
  // Otherwise, check the per-page permissions for sponsor-register edit.
  let canEditSponsors = profile.role === 'admin';
  if (!canEditSponsors) {
    const { data: perm } = await admin
      .from('admin_permissions')
      .select('can_edit')
      .eq('user_id', data.user.id)
      .eq('page', 'sponsor-register')
      .maybeSingle();
    canEditSponsors = perm?.can_edit === true;
  }

  return {
    userId:   data.user.id,
    role:     profile.role,
    name:     profile.full_name ?? null,
    canWrite: canEditSponsors,
  };
}

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
  const auth = await getAuth(request);
  if (!auth) return json({ ok: false, error: 'Unauthorized' }, 401);
  if (!auth.canWrite) return json({ ok: false, error: 'No edit permission for Sponsor Register' }, 403);
  const userId = auth.userId;

  const body = await readBody(request);
  const action = body.action;
  const memberId = body.member_id;
  if (!action) return json({ ok: false, error: 'action required' }, 400);
  if (!memberId) return json({ ok: false, error: 'member_id required' }, 400);

  const admin = getAdminClient();
  const isFormPost = !(request.headers.get('content-type') ?? '').includes('application/json');
  const savedFlash =
    action.startsWith('delete')  ? 'deleted' :
    action === 'update_sponsor_details' ? 'details' :
    action.includes('contact')   ? 'contact' :
    'activity';
  const redirectTo = `/admin/sponsor-register/${memberId}?saved=${savedFlash}`;

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

  // ── Sponsor details edit ────────────────────────────────────────────────
  // Applies changes to every sibling row in the sponsor group so the register
  // grouping stays intact (a sponsor with three membership numbers gets all
  // three rows updated at once). Logs an automatic diff note on the anchor.
  if (action === 'update_sponsor_details') {
    if (!body.full_name?.trim()) {
      return json({ ok: false, error: 'Sponsor name is required' }, 400);
    }

    const siblingIds = Array.isArray(body.sibling_ids)
      ? body.sibling_ids
      : String(body.sibling_ids ?? '').split(',').filter(Boolean);
    if (siblingIds.length === 0) siblingIds.push(memberId);

    // Read current values (from the anchor) so we can build a human-readable diff.
    const { data: before } = await admin
      .from('club_members')
      .select('full_name, membership_type, email, phone, postal_address')
      .eq('id', memberId)
      .single();

    const patch = {
      full_name:       body.full_name.trim(),
      membership_type: body.membership_type?.trim() || null,
      email:           body.email?.trim() || null,
      phone:           body.phone?.trim() || null,
      postal_address:  body.postal_address?.trim() || null,
    };

    const { error } = await admin.from('club_members').update(patch).in('id', siblingIds);
    if (error) return json({ ok: false, error: error.message }, 500);

    // Build a diff summary for the audit log.
    if (before) {
      const changes: string[] = [];
      const fields: Array<[keyof typeof patch, string]> = [
        ['full_name',       'Name'],
        ['membership_type', 'Type'],
        ['email',           'Email'],
        ['phone',           'Phone'],
        ['postal_address',  'Postal'],
      ];
      for (const [key, label] of fields) {
        const oldVal = (before as any)[key] ?? '';
        const newVal = patch[key] ?? '';
        if (oldVal !== newVal) {
          changes.push(`${label}: "${oldVal || '(blank)'}" → "${newVal || '(blank)'}"`);
        }
      }
      if (changes.length > 0) {
        await admin.from('sponsor_activities').insert({
          member_id:     memberId,
          activity_type: 'note',
          activity_date: new Date().toISOString().slice(0, 10),
          summary:       `Details edited by ${auth.name ?? 'portal user'}`,
          details:       changes.join('\n') + `\n\n(Applied to ${siblingIds.length} membership row${siblingIds.length === 1 ? '' : 's'}.)`,
          created_by:    userId,
        });
      }
    }

    return isFormPost ? redirect(redirectTo, 303) : json({ ok: true });
  }

  return json({ ok: false, error: 'Unknown action' }, 400);
};
