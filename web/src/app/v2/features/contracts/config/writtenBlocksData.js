// Public contract e-sign — fixed contract text blocks. Ported from the legacy
// `client/wittenBlocksData.js`. These are display labels and payment ordinals; the substantive
// clause text comes from the backend `contractUtility` payload (obligations / stageClauses /
// specialClauses / levelClauses).
//
// i18n: these are localized UI labels, so they are now built from the i18n translator `t`
// (resolved inside the component via useT — NEVER at module scope). Each builder takes `t` and
// returns the same shape the legacy module-scope constants exposed.

export function buildFixedText(t) {
  return {
    titles: {
      partyOne: t("contracts.fixed.title.partyOne"),
      amounts: t("contracts.fixed.title.amounts"),
      includesStages: t("contracts.fixed.title.includesStages"),
      payments: t("contracts.fixed.title.payments"),
      allStagesMatrix: t("contracts.fixed.title.allStagesMatrix"),
      drawings: t("contracts.fixed.title.drawings"),
      confirmation: t("contracts.fixed.title.confirmation"),
    },
    currencyAED: t("contracts.fixed.currencyAED"),
    confirmationLabel: t("contracts.fixed.confirmationLabel"),
    todayWritten: (d) => t("contracts.fixed.todayWritten").replace("{date}", d),
  };
}

// Payment ordinal label for the Nth payment (1-based). Index 0 has no label (legacy `null`).
export function paymentOrdinal(t, index) {
  if (!index || index < 1 || index > 20) return null;
  return t(`contracts.ordinal.${index}`);
}

// Default stage label for stage order 1..6.
export function defaultStageLabel(t, order) {
  if (!order || order < 1 || order > 6) return undefined;
  return t(`contracts.defaultStage.${order}`);
}
