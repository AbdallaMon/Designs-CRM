// Declarative filter descriptors for the leads pool list toolbar (consumed by the shared
// <DataTablePage> FilterControl). Single language (Arabic / RTL). Phase-0 light set.
//
// Only the STATUS enum lives here: the BE list reads `status` as a TOP-LEVEL query param
// (lead.usecase.js #buildListWhere), so the page routes a non-ALL selection through the list
// hook's `extra` (NOT the JSON `filters`). The free-text lead lookup is NOT a list filter — it
// is a cross-model utilities search that navigates straight to the picked lead, so it is
// rendered as <LeadSearchAutocomplete> in the PageHeader, not as a DataTablePage filter.

import { LEAD_STATUS_LABELS } from "./leadsConstants.js";

// i18n: filter labels are bilingual, so this is a FACTORY — buildLeadsFilters(t) is called
// inside the page (where useT is available). NEVER call a hook at module scope. The `options`
// are the enum value labels (Prisma enum keys → Arabic), resolved elsewhere, left as-is.
export function buildLeadsFilters(t) {
  return [
    {
      key: "status",
      type: "enum",
      label: t("leads.filters.status.label"),
      allLabel: t("leads.filters.status.all"),
      options: LEAD_STATUS_LABELS,
    },
  ];
}
