// Declarative filter descriptors for the leads pool list toolbar (consumed by the shared
// <DataTablePage> FilterControl). Single language (Arabic / RTL). Phase-0 light set.
//
// Only the STATUS enum lives here: the BE list reads `status` as a TOP-LEVEL query param
// (lead.usecase.js #buildListWhere), so the page routes a non-ALL selection through the list
// hook's `extra` (NOT the JSON `filters`). The free-text lead lookup is NOT a list filter — it
// is a cross-model utilities search that navigates straight to the picked lead, so it is
// rendered as <LeadSearchAutocomplete> in the PageHeader, not as a DataTablePage filter.

import { LEAD_STATUS_LABELS } from "./leadsConstants.js";

export const leadsFilters = [
  {
    key: "status",
    type: "enum",
    label: "الحالة",
    allLabel: "كل الحالات",
    options: LEAD_STATUS_LABELS,
  },
];
