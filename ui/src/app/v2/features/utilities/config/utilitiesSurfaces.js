// Utilities SURFACES config — the presentational contract for the redesigned utilities screen
// (UX plan §3.9). One place that declares: the URL-tab set, the cross-model search targets
// (mirroring the legacy searchData modelMap + its result projections), and the fixed-data list
// columns/filters consumed by <DataTablePage>. The page reads this config; it does NOT inline
// tab/column/search definitions. Single-language Arabic / RTL.
//
// NOTE on scope: these are STATIC Arabic UI labels (tab titles, column headers, model names),
// not backend message CODEs. The CODE→Arabic resolver (utilitiesMessages.js) is reserved for
// envelope `message` codes the API emits; static interface chrome stays as plain Arabic here,
// matching every other v2 feature config.

import { PERMISSIONS } from "@/app/v2/config/permissions";

const P = PERMISSIONS.UTILITY;

// ── URL-tab keys (synced into ?tab= by <UrlTabs>) ───────────────────────────────────────────
export const UTILITIES_TABS = Object.freeze({
  SEARCH: "search",
  USER_LOG: "user-log",
  FIXED_DATA: "fixed-data",
});

// Tab definitions + the permission gate for each surface. The page filters this set with the
// SAME usePermission predicate that gates the panel's content — nav never offers a 403 surface.
export const UTILITIES_TAB_DEFS = Object.freeze([
  { key: UTILITIES_TABS.SEARCH, label: "بحث", permission: P.SEARCH },
  { key: UTILITIES_TABS.USER_LOG, label: "سجل اليوم", permission: P.USER_LOG_VIEW },
  { key: UTILITIES_TABS.FIXED_DATA, label: "البيانات الثابتة", permission: P.FIXED_DATA_LIST },
]);

// ── cross-model search targets ──────────────────────────────────────────────────────────────
// Mirrors the legacy searchData() modelMap (user | client | clientLead) and its fixed select
// projections. Each entry knows how to read a result row's display fields and (if any) deep-link
// it to the record's detail route. `href: null` = no detail route for that model (read-only).
export const SEARCH_MODELS = Object.freeze({
  CLIENT_LEAD: "clientLead",
  CLIENT: "client",
  USER: "user",
});

export const SEARCH_MODEL_DEFS = Object.freeze([
  {
    key: SEARCH_MODELS.CLIENT_LEAD,
    label: "العملاء المحتملون",
    placeholder: "ابحث بالاسم أو البريد أو الهاتف أو الكود أو الرقم",
    // row: { id, code, client: { name, email, phone } }
    primary: (row) => row?.client?.name || (row?.code ? `#${row.code}` : `#${row?.id}`),
    secondary: (row) =>
      [row?.code ? `كود: ${row.code}` : null, row?.client?.phone, row?.client?.email]
        .filter(Boolean)
        .join(" · "),
    href: (row) => (row?.id != null ? `/v2/leads/${row.id}` : null),
  },
  {
    key: SEARCH_MODELS.CLIENT,
    label: "العملاء",
    placeholder: "ابحث بالاسم أو البريد أو الهاتف",
    // row: { id, name, email, phone }
    primary: (row) => row?.name || `#${row?.id}`,
    secondary: (row) => [row?.phone, row?.email].filter(Boolean).join(" · "),
    href: () => null, // no standalone client detail route
  },
  {
    key: SEARCH_MODELS.USER,
    label: "المستخدمون",
    placeholder: "ابحث بالاسم أو البريد",
    // row: { id, name, email, role }
    primary: (row) => row?.name || `#${row?.id}`,
    secondary: (row) => [row?.email, row?.role].filter(Boolean).join(" · "),
    href: (row) => (row?.id != null ? `/v2/users/${row.id}` : null),
  },
]);

export function getSearchModelDef(key) {
  return SEARCH_MODEL_DEFS.find((m) => m.key === key) ?? SEARCH_MODEL_DEFS[0];
}

// ── fixed-data list config (consumed by <DataTablePage>) ────────────────────────────────────
// listFixedData returns a flat array of { id, title, ... }. The list is read-only (no row
// actions); the toolbar carries a single client-side text filter over the title.
export const FIXED_DATA_COLUMNS = Object.freeze([
  { field: "id", headerName: "المعرّف", width: 96 },
  { field: "title", headerName: "العنوان", accessor: (row) => row?.title || "—" },
]);

export const FIXED_DATA_FILTERS = Object.freeze([
  { key: "search", type: "search", label: "بحث في البيانات الثابتة", placeholder: "اكتب للتصفية" },
]);
