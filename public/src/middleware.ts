import { defineMiddleware } from 'astro:middleware';
import { createClient } from '@supabase/supabase-js';
import { pathnameToPageKey } from './lib/admin-pages';
import type { PagePermission } from './lib/admin-pages';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Only gate /admin routes
  if (!pathname.startsWith('/admin')) return next();

  // Login page always passes through
  if (pathname === '/admin/login') return next();

  // ── 1. Verify session ────────────────────────────────────────────
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );
  const db = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const accessToken  = context.cookies.get('sb-access-token')?.value;
  const refreshToken = context.cookies.get('sb-refresh-token')?.value;

  if (!accessToken) return context.redirect('/admin/login');

  const { data: { user }, error: authErr } = await supabase.auth.getUser(accessToken);
  if (authErr || !user) return context.redirect('/admin/login');

  // ── 2. Load profile ──────────────────────────────────────────────
  // Note: 'title' column added in migration 003 — fall back gracefully if not yet applied
  const { data: profile } = await db
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single();

  if (!profile) return context.redirect('/admin/login');

  const isAdmin = profile.role === 'admin';

  // ── 3. Dashboard is always accessible ───────────────────────────
  const pageKey = pathnameToPageKey(pathname);

  context.locals.user        = { ...user, profile };
  context.locals.isAdmin     = isAdmin;
  context.locals.pageKey     = pageKey;

  if (pageKey === 'dashboard' || isAdmin) {
    context.locals.canView = true;
    context.locals.canEdit = true;
    context.locals.permissions = [] as PagePermission[];
    return next();
  }

  // ── 4. Load this user's permissions ─────────────────────────────
  const { data: perms } = await db
    .from('admin_permissions')
    .select('page, can_view, can_edit')
    .eq('user_id', user.id);

  const permMap = new Map<string, PagePermission>();
  for (const p of perms ?? []) permMap.set(p.page, p);

  // Attach full permission map for the layout to filter the nav
  context.locals.permissions = (perms ?? []) as PagePermission[];

  const pagePerm = permMap.get(pageKey);

  if (!pagePerm?.can_view) {
    // No view access → redirect to dashboard with a flag
    return context.redirect('/admin?denied=1');
  }

  context.locals.canView = true;
  context.locals.canEdit = pagePerm.can_edit === true;

  return next();
});
