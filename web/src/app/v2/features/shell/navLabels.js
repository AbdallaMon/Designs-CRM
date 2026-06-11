// Arabic message map for the app-shell nav (groups + items). Keeps visible strings OUT of the
// nav.config logic (labelKey → Arabic here). Single source for the side-nav copy. The user may
// refine wording; change it in ONE place. Single-language Arabic / RTL.

export const NAV_GROUP_LABELS = {
  home: "الرئيسية",
  sales: "المبيعات",
  production: "الإنتاج",
  finance: "المالية",
  admin: "الإدارة",
};

export const NAV_ITEM_LABELS = {
  dashboard: "لوحة التحكم",
  notifications: "الإشعارات",
  chat: "المحادثات",
  leads: "الصفقات",
  adminProjects: "المشاريع (إدارة)",
  commissions: "العمولات",
  projects: "المشاريع",
  tasks: "المهام",
  imageSessions: "جلسات الصور",
  accounting: "المحاسبة",
  contractPayments: "العقود — الدفعات",
  users: "المستخدمون",
  siteUtilities: "إعدادات الموقع",
  reviews: "المراجعات",
  reports: "التقارير",
  utilities: "أدوات",
};

/** Resolve a nav group key to its Arabic label. */
export const resolveNavGroup = (key) => NAV_GROUP_LABELS[key] ?? key;
/** Resolve a nav item labelKey to its Arabic label. */
export const resolveNavItem = (key) => NAV_ITEM_LABELS[key] ?? key;
