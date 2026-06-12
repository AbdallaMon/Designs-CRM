// Declarative filter descriptors for the user-management list toolbar (consumed by the shared
// <DataTablePage> FilterControl). The page maps filter values onto the list hook's search +
// JSON-filters state. Mirrors the light Phase-0 filter set documented in
// shared/components/DataTablePage.jsx.
//
// i18n: labels are bilingual, so the filters are a FACTORY — buildUsersFilters(t) is called inside
// the page (where useT is available). NEVER call a hook at module scope.

import { buildUserStatusFilterOptions } from "./usersConstants.js";

export function buildUsersFilters(t) {
  return [
    {
      // BE PARITY: the management list repo (findManagementList) only honors `filters.userId`
      // and `filters.status` — it has NO name/email free-text search. So this search box is
      // scoped to the numeric user id; a non-numeric term is treated as no filter (mirrors the
      // leads list, whose search is likewise id-scoped). Labelled truthfully.
      key: "search",
      type: "search",
      label: t("users.filters.search.label"),
      placeholder: t("users.filters.search.placeholder"),
    },
    {
      key: "status",
      type: "enum",
      label: t("users.filters.status.label"),
      allLabel: t("users.filters.status.all"),
      options: buildUserStatusFilterOptions(t),
    },
  ];
}
