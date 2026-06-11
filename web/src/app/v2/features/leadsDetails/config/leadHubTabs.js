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
  CHAT: "chat", // PERMISSIONS.CHAT.ROOM_LIST
  UPDATES: "updates", // PERMISSIONS.UPDATE.LIST
};

// 5 groups. `sub` order is also the sub-tab order; the first VISIBLE sub is a group's default.
//
// i18n: each group/sub carries a `labelKey` (resolved via t("leadsDetails.<key>") at RENDER time
// in LeadDetailsPage) instead of a hardcoded Arabic `label`, so this static module export holds no
// language strings. Navigation/visibility logic keys off `key`/`gateKey`, never the label.
export const LEAD_HUB_GROUPS = [
  {
    key: "overview",
    labelKey: "leadsDetails.group.overview",
    sub: [{ key: "overview", labelKey: "leadsDetails.sub.overview", gateKey: GATE.ALWAYS }],
  },
  {
    key: "record",
    labelKey: "leadsDetails.group.record",
    sub: [
      { key: "calls", labelKey: "leadsDetails.sub.calls", gateKey: GATE.ALWAYS },
      { key: "meetings", labelKey: "leadsDetails.sub.meetings", gateKey: GATE.ALWAYS },
      { key: "notes", labelKey: "leadsDetails.sub.notes", gateKey: GATE.ALWAYS },
      { key: "files", labelKey: "leadsDetails.sub.files", gateKey: GATE.ALWAYS },
      { key: "chats", labelKey: "leadsDetails.sub.chats", gateKey: GATE.CHAT },
    ],
  },
  {
    key: "production",
    labelKey: "leadsDetails.group.production",
    sub: [
      { key: "projects", labelKey: "leadsDetails.sub.projects", gateKey: GATE.PROJECTS },
      { key: "sessions", labelKey: "leadsDetails.sub.sessions", gateKey: GATE.SESSIONS },
      { key: "updates", labelKey: "leadsDetails.sub.updates", gateKey: GATE.UPDATES },
    ],
  },
  {
    key: "finance",
    labelKey: "leadsDetails.group.finance",
    sub: [
      { key: "contracts", labelKey: "leadsDetails.sub.contracts", gateKey: GATE.CONTRACTS },
      { key: "payments", labelKey: "leadsDetails.sub.payments", gateKey: GATE.PAYMENT },
      { key: "priceOffers", labelKey: "leadsDetails.sub.priceOffers", gateKey: GATE.PRICE_OFFER },
    ],
  },
  {
    key: "sales",
    labelKey: "leadsDetails.group.sales",
    sub: [
      { key: "salesStage", labelKey: "leadsDetails.sub.salesStage", gateKey: GATE.STAGE },
      { key: "spin", labelKey: "leadsDetails.sub.spin", gateKey: GATE.SPIN },
      { key: "versa", labelKey: "leadsDetails.sub.versa", gateKey: GATE.VERSA },
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
