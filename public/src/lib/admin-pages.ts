/** Canonical list of all admin pages used for the permissions grid.
 *  'dashboard' is always visible to all authenticated users — omitted from the
 *  per-person grant table intentionally.
 */
export const ADMIN_PAGES = [
  { key: 'players',        label: 'Player Registry',      icon: '👥' },
  { key: 'qualifications', label: 'Qualifications & WWC', icon: '📋' },
  { key: 'results',        label: 'Results',              icon: '🏉' },
  { key: 'fixtures',       label: 'Fixtures',             icon: '📅' },
  { key: 'roster',         label: 'Bar Roster',           icon: '🍺' },
  { key: 'canteen',        label: 'Canteen Roster',       icon: '🥘' },
  { key: 'sponsors',       label: 'Sponsors',             icon: '🤝' },
  { key: 'news',           label: 'News',                 icon: '📰' },
  { key: 'takeovers',      label: 'Announcements',        icon: '📣' },
  { key: 'gallery',        label: 'Gallery',              icon: '🖼' },
  { key: 'config',         label: 'Site Settings',        icon: '⚙' },
  { key: 'secretary',      label: 'Secretary Tools',      icon: '📁' },
  { key: 'members',        label: 'Committee Members',    icon: '👤' },
] as const;

export type PageKey = (typeof ADMIN_PAGES)[number]['key'];

export interface PagePermission {
  page:     PageKey;
  can_view: boolean;
  can_edit: boolean;
}

/** Extract page key from an admin pathname, e.g. /admin/players → 'players' */
export function pathnameToPageKey(pathname: string): PageKey | 'dashboard' {
  const seg = pathname.replace(/^\/admin\/?/, '').split('/')[0];
  if (!seg) return 'dashboard';
  return seg as PageKey;
}
