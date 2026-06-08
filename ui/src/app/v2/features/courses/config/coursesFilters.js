// Declarative filter config for the admin courses LIST toolbar (<DataTablePage>). Phase-0 set
// matching the canonical leads/users toolbar shape. NOTE: the BE list endpoint (GET /courses)
// only honors page/limit today, so these are CLIENT-side conveniences applied to the current
// page rows (the page wires them); they do not widen the contract.

export const coursesFilters = [
  {
    key: "search",
    type: "search",
    label: "بحث",
    placeholder: "ابحث باسم الدورة",
  },
  {
    key: "status",
    type: "enum",
    label: "الحالة",
    allLabel: "الكل",
    options: { PUBLISHED: "منشورة", DRAFT: "مسودة" },
  },
];

export default coursesFilters;
