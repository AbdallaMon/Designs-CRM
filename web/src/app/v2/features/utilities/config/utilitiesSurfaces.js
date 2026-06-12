// Utilities SURFACES config — the presentational contract for the redesigned utilities screen
// (UX plan §3.9). One place that declares: the URL-tab set, the cross-model search targets
// (mirroring the legacy searchData modelMap + its result projections), and the fixed-data list
// columns/filters consumed by <DataTablePage>. The page reads this config; it does NOT inline
// tab/column/search definitions. Single-language Arabic / RTL.
//
// NOTE on scope: user-visible labels (tab titles, column headers, model names) are bilingual via
// the i18n layer. Module-scope definitions carry i18n KEYS (labelKey / headerKey / placeholderKey)
// — NOT literal strings — and the consuming component resolves them with t() at render time
// (useT() is a hook and must never be called at module scope). The search-model row projections
// that need t() (e.g. the "كود: …" prefix) are produced by buildSearchModelDefs(t), a factory the
// component calls inside its body. The CODE→Arabic resolver (utilitiesMessages.js) is reserved for
// envelope `message` codes the API emits; static interface chrome uses the i18n dictionary instead.

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
// `labelKey` is resolved with t() at render time (the page maps it to a label).
export const UTILITIES_TAB_DEFS = Object.freeze([
  { key: UTILITIES_TABS.SEARCH, labelKey: "utilities.tab.search", permission: P.SEARCH },
  { key: UTILITIES_TABS.USER_LOG, labelKey: "utilities.tab.userLog", permission: P.USER_LOG_VIEW },
  { key: UTILITIES_TABS.FIXED_DATA, labelKey: "utilities.tab.fixedData", permission: P.FIXED_DATA_LIST },
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

// The model defs carry i18n KEYS at module scope (labelKey / placeholderKey) plus the raw
// row-projection helpers (primary / secondary / href). `label` and `placeholder` are NOT resolved
// here (no t() at module scope); buildSearchModelDefs(t) produces render-ready defs with localized
// `label`, `placeholder`, and a localized `secondary` (the "كود: …" prefix). The raw `secondary`
// below is the verbatim fallback used by callers that read SEARCH_MODEL_DEFS / getSearchModelDef
// directly (e.g. LeadSearchAutocomplete) — it preserves the original Arabic exactly.
export const SEARCH_MODEL_DEFS = Object.freeze([
  {
    key: SEARCH_MODELS.CLIENT_LEAD,
    labelKey: "utilities.search.model.clientLead.label",
    placeholderKey: "utilities.search.model.clientLead.placeholder",
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
    labelKey: "utilities.search.model.client.label",
    placeholderKey: "utilities.search.model.client.placeholder",
    // row: { id, name, email, phone }
    primary: (row) => row?.name || `#${row?.id}`,
    secondary: (row) => [row?.phone, row?.email].filter(Boolean).join(" · "),
    href: () => null, // no standalone client detail route
  },
  {
    key: SEARCH_MODELS.USER,
    labelKey: "utilities.search.model.user.label",
    placeholderKey: "utilities.search.model.user.placeholder",
    // row: { id, name, email, role }
    primary: (row) => row?.name || `#${row?.id}`,
    secondary: (row) => [row?.email, row?.role].filter(Boolean).join(" · "),
    href: (row) => (row?.id != null ? `/v2/users/${row.id}` : null),
  },
]);

// Localized secondary builder for the clientLead row (the only def whose secondary carries a
// translatable prefix). Other models' secondary has no UI prose → reused verbatim.
function buildLocalizedSecondary(def, t) {
  if (def.key !== SEARCH_MODELS.CLIENT_LEAD) return def.secondary;
  return (row) =>
    [
      row?.code
        ? t("utilities.search.model.clientLead.codePrefix").replace("{code}", row.code)
        : null,
      row?.client?.phone,
      row?.client?.email,
    ]
      .filter(Boolean)
      .join(" · ");
}

// buildSearchModelDefs(t) — resolve the module-scope defs into render-ready defs whose `label`,
// `placeholder`, and `secondary(row)` are fully localized. Call inside a component (t from useT()).
export function buildSearchModelDefs(t) {
  return SEARCH_MODEL_DEFS.map((def) => ({
    key: def.key,
    label: t(def.labelKey),
    placeholder: t(def.placeholderKey),
    primary: def.primary,
    href: def.href,
    secondary: buildLocalizedSecondary(def, t),
  }));
}

export function getSearchModelDef(key) {
  return SEARCH_MODEL_DEFS.find((m) => m.key === key) ?? SEARCH_MODEL_DEFS[0];
}

// ── fixed-data list config (consumed by <DataTablePage>) ────────────────────────────────────
// listFixedData returns a flat array of { id, title, ... }. The list is read-only (no row
// actions); the toolbar carries a single client-side text filter over the title.
// Columns/filters carry i18n KEYS (headerKey / labelKey / placeholderKey); the component builds
// the t()-resolved arrays with buildFixedDataColumns(t) / buildFixedDataFilters(t).
export const FIXED_DATA_COLUMNS = Object.freeze([
  { field: "id", headerKey: "utilities.fixedData.col.id", width: 96 },
  { field: "title", headerKey: "utilities.fixedData.col.title", accessor: (row) => row?.title || "—" },
]);

export const FIXED_DATA_FILTERS = Object.freeze([
  {
    key: "search",
    type: "search",
    labelKey: "utilities.fixedData.filter.search",
    placeholderKey: "utilities.fixedData.filter.placeholder",
  },
]);

export function buildFixedDataColumns(t) {
  return FIXED_DATA_COLUMNS.map(({ headerKey, ...rest }) => ({
    ...rest,
    headerName: t(headerKey),
  }));
}

export function buildFixedDataFilters(t) {
  return FIXED_DATA_FILTERS.map(({ labelKey, placeholderKey, ...rest }) => ({
    ...rest,
    label: t(labelKey),
    placeholder: t(placeholderKey),
  }));
}
