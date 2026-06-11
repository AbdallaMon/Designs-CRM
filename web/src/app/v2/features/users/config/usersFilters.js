// Declarative filter descriptors for the user-management list toolbar (consumed by the shared
// <DataTablePage> FilterControl). The page maps filter values onto the list hook's search +
// JSON-filters state. Single-language (Arabic). Mirrors the light Phase-0 filter set documented
// in shared/components/DataTablePage.jsx.

import { USER_STATUS_FILTER_OPTIONS } from "./usersConstants.js";

export const usersFilters = [
  {
    // BE PARITY: the management list repo (findManagementList) only honors `filters.userId`
    // and `filters.status` — it has NO name/email free-text search. So this search box is
    // scoped to the numeric user id; a non-numeric term is treated as no filter (mirrors the
    // leads list, whose search is likewise id-scoped). Labelled truthfully.
    key: "search",
    type: "search",
    label: "بحث برقم المستخدم",
    placeholder: "رقم المستخدم",
  },
  {
    key: "status",
    type: "enum",
    label: "الحالة",
    allLabel: "كل الحالات",
    options: USER_STATUS_FILTER_OPTIONS,
  },
];
