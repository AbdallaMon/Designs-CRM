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

/** Resolve a nav group key to its Arabic label. */
export const resolveNavGroup = (key) => NAV_GROUP_LABELS[key] ?? key;
/** Resolve a nav item labelKey to its Arabic label. */
export const resolveNavItem = (key) => NAV_ITEM_LABELS[key] ?? key;

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
