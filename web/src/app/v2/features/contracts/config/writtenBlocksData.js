// Public contract e-sign — fixed contract text blocks. Ported from the legacy
// `client/wittenBlocksData.js` but SINGLE-LANGUAGE Arabic (the v2 app is Arabic/RTL only).
// These are display labels and payment ordinals; the substantive clause text comes from the
// backend `contractUtility` payload (obligations / stageClauses / specialClauses / levelClauses).

export const FIXED_TEXT = {
  titles: {
    partyOne: "الفريق الأول: المالك أو وكيله",
    amounts: "تكلفة التصميم",
    includesStages: "يشمل هذا الاتفاق المراحل",
    payments: "جدول الدفعات",
    allStagesMatrix: "جدول المراحل",
    drawings: "مساحات العمل (المخططات)",
    confirmation: "إقرار الموافقة",
  },
  currencyAED: "درهم إماراتي",
  confirmationLabel: "أقرّ بأنني قرأت جميع البنود وأوافق عليها",
  todayWritten: (d) => `تاريخ كتابة العقد: ${d}`,
};

export const PAYMENT_ORDINAL = [
  null,
  "دفعه أولى",
  "دفعه ثانية",
  "دفعة ثالثة",
  "دفعة رابعة",
  "دفعة خامسة",
  "دفعة سادسة",
  "دفعة سابعة",
  "دفعة ثامنة",
  "دفعة تاسعة",
  "دفعة عاشرة",
  "دفعة حادية عشرة",
  "دفعة ثانية عشرة",
  "دفعة ثالثة عشرة",
  "دفعة رابعة عشرة",
  "دفعة خامسة عشرة",
  "دفعة سادسة عشرة",
  "دفعة سابعة عشرة",
  "دفعة ثامنة عشرة",
  "دفعة تاسعة عشرة",
  "دفعة عشرون",
];

export const defaultStageLabels = {
  1: "اجتماع أولي",
  2: "تخطيط المساحات",
  3: "تصميم ثلاثي الأبعاد",
  4: "مخططات تنفيذية",
  5: "حساب كميات وأسعار",
  6: "تنفيذ",
};
