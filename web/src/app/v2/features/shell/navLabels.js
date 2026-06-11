// Arabic message map for the app-shell nav (groups + items). Keeps visible strings OUT of the
// nav.config logic (labelKey → Arabic here). Single source for the side-nav copy. The user may
// refine wording; change it in ONE place. Single-language Arabic / RTL.

export const NAV_GROUP_LABELS = {
  home: "الرئيسية",
  sales: "المبيعات",
  production: "الإنتاج",
  finance: "الشؤون المالية",
  admin: "الإدارة",
};

export const NAV_ITEM_LABELS = {
  dashboard: "لوحة التحكم",
  leadsWorkspace: "مساحة عملي",
  notifications: "الإشعارات",
  chat: "المحادثات",
  leads: "قائمة العملاء",
  adminProjects: "إدارة المشاريع",
  commissions: "العمولات",
  projects: "المشاريع",
  tasks: "المهام",
  imageSessions: "جلسات التصميم",
  accounting: "المحاسبة",
  contractPayments: "دفعات العقود",
  users: "المستخدمون",
  siteUtilities: "إعدادات الموقع",
  reports: "التقارير",
  utilities: "الأدوات",
};

// One-line captions shown UNDER a destination row in the WorkspacePanel — a subtle hint of what
// the destination is for, disambiguating look-alike entries (audit C2: leadsWorkspace vs leads).
// Keyed by the nav item's labelKey. Not every item needs one; rows without a caption render the
// label alone. Caption typography / text.secondary. Single-language Arabic / RTL.
export const NAV_ITEM_CAPTIONS = {
  leadsWorkspace: "مهامك اليومية",
  leads: "البحث في كل العملاء",
  dashboard: "نظرة عامة",
};

/** Resolve a nav group key to its Arabic label. */
export const resolveNavGroup = (key) => NAV_GROUP_LABELS[key] ?? key;
/** Resolve a nav item labelKey to its Arabic label. */
export const resolveNavItem = (key) => NAV_ITEM_LABELS[key] ?? key;
/** Resolve a nav item labelKey to its optional one-line caption (or null when none). */
export const resolveNavItemCaption = (key) => NAV_ITEM_CAPTIONS[key] ?? null;

// ─────────────────────────────────────────────────────────────────────────────
// WORKSPACE labels (new app-shell rail). Distinct from NAV_GROUP_LABELS: the rail
// frames the "home" zone as the user's personal space ("مساحتي"), while the older
// side-nav group header reads "الرئيسية". Keys mirror WORKSPACES[].labelKey.
// ─────────────────────────────────────────────────────────────────────────────
export const WORKSPACE_LABELS = {
  home: "مساحتي",
  sales: "المبيعات",
  production: "الإنتاج",
  finance: "الشؤون المالية",
  admin: "الإدارة",
};

/** Resolve a workspace labelKey to its Arabic label. */
export const resolveWorkspaceLabel = (key) => WORKSPACE_LABELS[key] ?? key;

// Display-only landing preference per role (which workspace the rail highlights / the logo
// lands on by default when no path override applies). NEVER a gate — purely cosmetic
// orientation. Keys are the Prisma UserRole enum values (auth/me display fields). The
// resolver below falls back to "first accessible workspace" when there is no override or the
// preferred workspace isn't accessible to this user.
export const DEFAULT_WORKSPACE_BY_ROLE = {
  STAFF: "home",
  SUPER_SALES: "home",
  THREE_D_DESIGNER: "production",
  TWO_D_DESIGNER: "production",
  TWO_D_EXECUTOR: "production",
  ACCOUNTANT: "finance",
  ADMIN: "home",
  SUPER_ADMIN: "home",
  CONTACT_INITIATOR: "sales",
};

/**
 * Resolve the default workspace for a user against the set of workspaces they can actually
 * reach (the built workspace-nav). Order of preference:
 *   1. the role override (activeRole / role; isSuperSales nudges to "home") — IF accessible,
 *   2. otherwise the first accessible workspace,
 *   3. otherwise null (no reachable workspace).
 *
 * @param {object} user              auth user (activeRole/role/isSuperSales display fields).
 * @param {Array}  accessibleWorkspaceKeys  keys of workspaces with ≥1 visible item.
 */
export function resolveDefaultWorkspace(user, accessibleWorkspaceKeys = []) {
  const accessible = new Set(accessibleWorkspaceKeys);
  const role = user?.activeRole ?? user?.role;
  let preferred = DEFAULT_WORKSPACE_BY_ROLE[role];
  // Super-sales is a staff power-flag, not a base role — nudge it to the personal space.
  if (user?.isSuperSales && !preferred) preferred = "home";

  if (preferred && accessible.has(preferred)) return preferred;
  return accessibleWorkspaceKeys[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Explicit LANDING DESTINATION override per role (audit H1). Some personas should land on a
// SPECIFIC screen rather than "the first destination of their default workspace". Sales personas
// (STAFF / SUPER_SALES / CONTACT_INITIATOR) land on the daily cockpit — their real starting
// point — instead of the dashboard. Keys are the Prisma UserRole enum values. When a role has no
// override here, the caller falls back to the resolved-default-workspace's first destination.
// This is display-only landing preference, NEVER a gate (the server still enforces access).
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_DESTINATION_BY_ROLE = {
  STAFF: "/v2/leads/workspace",
  SUPER_SALES: "/v2/leads/workspace",
  CONTACT_INITIATOR: "/v2/leads/workspace",
};

/**
 * The explicit landing href for a user's role, or null when there's no override. Super-sales is a
 * staff power-flag (not a base role) — treat it as a sales persona too. The caller should only
 * honour this when the destination is actually reachable for the user (it always falls back to
 * the resolved-workspace first destination otherwise).
 *
 * @param {object} user  auth user (activeRole/role/isSuperSales display fields).
 */
export function resolveDefaultDestination(user) {
  const role = user?.activeRole ?? user?.role;
  if (DEFAULT_DESTINATION_BY_ROLE[role]) return DEFAULT_DESTINATION_BY_ROLE[role];
  if (user?.isSuperSales) return DEFAULT_DESTINATION_BY_ROLE.SUPER_SALES;
  return null;
}
