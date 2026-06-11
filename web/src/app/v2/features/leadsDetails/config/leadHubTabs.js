// Lead-hub tab model — the SINGLE source of truth for the regrouped detail screen.
// The flat legacy tabs (overview, calls, meetings, notes, files, priceOffers, payments,
// projects, spin, versa, sessions) are reorganized into 5 GROUPS, each with sub-sections.
// Both the group/sub-tab strips (LeadDetailsPage) and the related-rail (LeadRelatedRail)
// resolve navigation + visibility from here, so a card and its tab can never drift.
//
// Visibility is NOT decided here — gating depends on runtime caps/permissions. Instead each
// section exposes a `gateKey` that the page maps to a boolean (buildSectionGates). A GROUP is
// shown iff ≥1 of its sub-sections is visible; the group's default sub = first visible section.

// Section gate keys (resolved to booleans at runtime from caps.* × hasPermission(...)).
export const GATE = {
  ALWAYS: "always", // visible to any lead viewer
  PRICE_OFFER: "priceOffer", // caps.canAddPriceOffer
  PAYMENT: "payment", // caps.canAddPayment || caps.canSendReminder
  CONTRACTS: "contracts", // PERMISSIONS.CONTRACT.LIST
  PROJECTS: "projects", // PERMISSIONS.PROJECT.LIST
  SESSIONS: "sessions", // PERMISSIONS.IMAGE_SESSION.SESSION_VIEW
  STAGE: "stage", // PERMISSIONS.SALES_STAGE.VIEW
  SPIN: "spin", // PERMISSIONS.QUESTION.CONFIG_VIEW || SESSION_VIEW
  VERSA: "versa", // PERMISSIONS.QUESTION.SESSION_VIEW
};

// 5 groups. `sub` order is also the sub-tab order; the first VISIBLE sub is a group's default.
export const LEAD_HUB_GROUPS = [
  {
    key: "overview",
    label: "نظرة عامة",
    sub: [{ key: "overview", label: "التفاصيل", gateKey: GATE.ALWAYS }],
  },
  {
    key: "record",
    label: "السجل",
    sub: [
      { key: "calls", label: "المكالمات", gateKey: GATE.ALWAYS },
      { key: "meetings", label: "الاجتماعات", gateKey: GATE.ALWAYS },
      { key: "notes", label: "الملاحظات", gateKey: GATE.ALWAYS },
      { key: "files", label: "المرفقات", gateKey: GATE.ALWAYS },
    ],
  },
  {
    key: "production",
    label: "الأعمال",
    sub: [
      { key: "projects", label: "المشاريع", gateKey: GATE.PROJECTS },
      { key: "sessions", label: "جلسات الصور", gateKey: GATE.SESSIONS },
    ],
  },
  {
    key: "finance",
    label: "المالية",
    sub: [
      { key: "contracts", label: "العقود", gateKey: GATE.CONTRACTS },
      { key: "payments", label: "الدفعات", gateKey: GATE.PAYMENT },
      { key: "priceOffers", label: "عروض الأسعار", gateKey: GATE.PRICE_OFFER },
    ],
  },
  {
    key: "sales",
    label: "أدوات المبيعات",
    sub: [
      { key: "salesStage", label: "مرحلة البيع", gateKey: GATE.STAGE },
      { key: "spin", label: "أسئلة SPIN", gateKey: GATE.SPIN },
      { key: "versa", label: "معالجة الاعتراضات", gateKey: GATE.VERSA },
    ],
  },
];

// Resolve (group, sub) for a section key — used by the rail to deep-link a card to its section.
export function locateSection(sectionKey) {
  for (const group of LEAD_HUB_GROUPS) {
    const sub = group.sub.find((s) => s.key === sectionKey);
    if (sub) return { groupKey: group.key, subKey: sub.key, gateKey: sub.gateKey };
  }
  return null;
}
