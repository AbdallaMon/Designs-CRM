// uiDictionary — the bilingual (ar/en) dictionary for the AUTHED v2 dashboard shell.
//
// Shape: { ar: { key: "عربي" }, en: { key: "English" } }. Keys are stable, namespaced-by-dot
// identifiers (e.g. "nav.group.sales", "common.save"). `useT()` / `t(key, fallback?)` looks the
// current language up here.
//
// SCOPE (Phase 1): the SHELL + NAV chrome, a handful of COMMON shared strings (the 5 state
// components' default copy, common buttons, the role chip fallback). Per-FEATURE page bodies are
// deliberately NOT here yet — they keep their hardcoded Arabic and are filled in later phases.
//
// CONTRACT: the `ar` side is the EXISTING wording, copied verbatim from the components/maps it
// replaces, so ar renders identically. `en` is the additive translation.
//
// This is intentionally a separate file from the legacy public-funnel `dictionary.js` (which is a
// flat English-key → Arabic map for the marketing site). Different layer, different lifecycle.
//
// COMPOSITION (added): the per-feature dictionaries under ./dictionaries/ are DEEP-MERGED on top of
// the core keys below. A feature agent fills ./dictionaries/<feature>.js (ar+en) and its keys are
// picked up here automatically — NO edit to this file or the barrel. The core keys below stay the
// authoritative source for the shell/nav/common/state chrome; the merged feature maps are additive,
// so with empty stubs the resolved dictionary is byte-identical to before.

import { featureDictionaries, deepMerge } from "./dictionaries/index.js";

const coreDictionary = {
  ar: {
    // ── nav: group headers ──────────────────────────────────────────────────────
    "nav.group.home": "الرئيسية",
    "nav.group.sales": "المبيعات",
    "nav.group.production": "الإنتاج",
    "nav.group.finance": "الشؤون المالية",
    "nav.group.admin": "الإدارة",

    // ── nav: items ──────────────────────────────────────────────────────────────
    "nav.item.dashboard": "لوحة التحكم",
    "nav.item.leadsWorkspace": "مساحة عملي",
    "nav.item.notifications": "الإشعارات",
    "nav.item.chat": "المحادثات",
    "nav.item.leads": "قائمة العملاء",
    "nav.item.leadsNew": "العملاء المحتملون",
    "nav.item.leadsDeals": "الصفقات الحالية",
    "nav.item.adminProjects": "إدارة المشاريع",
    "nav.item.commissions": "العمولات",
    "nav.item.projects": "المشاريع",
    "nav.item.tasks": "المهام",
    "nav.item.imageSessions": "جلسات التصميم",
    "nav.item.accounting": "المحاسبة",
    "nav.item.contractPayments": "دفعات العقود",
    "nav.item.users": "المستخدمون",
    "nav.item.siteUtilities": "إعدادات الموقع",
    "nav.item.reports": "التقارير",
    "nav.item.utilities": "الأدوات",

    // ── shell chrome ────────────────────────────────────────────────────────────
    "shell.brand": "Dream Studio",
    "shell.nav.aria": "القائمة الرئيسية",
    "shell.breadcrumb.aria": "مسار التنقل",
    "shell.menu.open": "فتح القائمة",
    "shell.menu.close": "إغلاق القائمة",
    "shell.rail.expand": "توسيع القائمة",
    "shell.rail.collapse": "طيّ القائمة",
    "shell.account.aria": "حساب المستخدم",
    "shell.logout": "تسجيل الخروج",
    "shell.lang.toggle": "تغيير اللغة",

    // ── common: buttons ─────────────────────────────────────────────────────────
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.confirm": "تأكيد",
    "common.delete": "حذف",
    "common.retry": "إعادة المحاولة",

    // ── common: state components (default copy) ─────────────────────────────────
    "state.empty.title": "لا توجد بيانات",
    "state.error.title": "تعذّر تحميل البيانات",
    "state.loading.label": "جاري التحميل…",
    "state.partial.deniedTitle": "هذا القسم غير متاح لصلاحياتك",
    "state.partial.deniedMessage":
      "لا تملك صلاحية الوصول إلى هذا القسم. إن كنت تظن أنه ينبغي أن تصل إليه، تواصل مع المسؤول.",
    "state.partial.bannerTitle": "عرض محدود حسب صلاحياتك",
    "state.partial.bannerMessage": "بعض الأقسام مخفية لأنها خارج نطاق صلاحياتك.",
    "state.success.title": "تمت العملية بنجاح",

    // ── common: misc ────────────────────────────────────────────────────────────
    "common.dash": "—",
  },

  en: {
    // ── nav: group headers ──────────────────────────────────────────────────────
    "nav.group.home": "Home",
    "nav.group.sales": "Sales",
    "nav.group.production": "Production",
    "nav.group.finance": "Finance",
    "nav.group.admin": "Administration",

    // ── nav: items ──────────────────────────────────────────────────────────────
    "nav.item.dashboard": "Dashboard",
    "nav.item.leadsWorkspace": "My Workspace",
    "nav.item.notifications": "Notifications",
    "nav.item.chat": "Chat",
    "nav.item.leads": "Leads",
    "nav.item.leadsNew": "Potential clients",
    "nav.item.leadsDeals": "Current deals",
    "nav.item.adminProjects": "Project Management",
    "nav.item.commissions": "Commissions",
    "nav.item.projects": "Projects",
    "nav.item.tasks": "Tasks",
    "nav.item.imageSessions": "Design Sessions",
    "nav.item.accounting": "Accounting",
    "nav.item.contractPayments": "Contract Payments",
    "nav.item.users": "Users",
    "nav.item.siteUtilities": "Site Settings",
    "nav.item.reports": "Reports",
    "nav.item.utilities": "Utilities",

    // ── shell chrome ────────────────────────────────────────────────────────────
    "shell.brand": "Dream Studio",
    "shell.nav.aria": "Main menu",
    "shell.breadcrumb.aria": "Breadcrumb",
    "shell.menu.open": "Open menu",
    "shell.menu.close": "Close menu",
    "shell.rail.expand": "Expand menu",
    "shell.rail.collapse": "Collapse menu",
    "shell.account.aria": "User account",
    "shell.logout": "Log out",
    "shell.lang.toggle": "Change language",

    // ── common: buttons ─────────────────────────────────────────────────────────
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.delete": "Delete",
    "common.retry": "Retry",

    // ── common: state components (default copy) ─────────────────────────────────
    "state.empty.title": "No data",
    "state.error.title": "Failed to load data",
    "state.loading.label": "Loading…",
    "state.partial.deniedTitle": "This section is not available for your permissions",
    "state.partial.deniedMessage":
      "You don't have permission to access this section. If you think you should, contact the administrator.",
    "state.partial.bannerTitle": "Limited view based on your permissions",
    "state.partial.bannerMessage": "Some sections are hidden because they are outside your permissions.",
    "state.success.title": "Done successfully",

    // ── common: misc ────────────────────────────────────────────────────────────
    "common.dash": "—",
  },
};

// The exported dictionary = core keys with the per-feature dictionaries deep-merged on top.
// Built once at module load. With empty stubs this equals coreDictionary exactly (ar unchanged).
export const uiDictionary = {
  ar: deepMerge(deepMerge({}, coreDictionary.ar), featureDictionaries.ar),
  en: deepMerge(deepMerge({}, coreDictionary.en), featureDictionaries.en),
};

/**
 * Resolve a dictionary key for a language. Falls back: requested lang → ar → the provided
 * `fallback` → the key itself (so a missing key is visible in dev, never a crash).
 */
export function translate(lang, key, fallback) {
  const langMap = uiDictionary[lang] ?? uiDictionary.ar;
  if (langMap[key] !== undefined) return langMap[key];
  if (uiDictionary.ar[key] !== undefined) return uiDictionary.ar[key];
  return fallback ?? key;
}
