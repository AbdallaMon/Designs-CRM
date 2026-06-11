// Contract domain display constants — ported from the legacy `@/app/helpers/constants`
// (CONTRACT_LEVELSENUM / contractLevel / contractStatus / contractLevelStatus /
// STAGE_STATUS_LABEL / EMIRATE_LABEL / UAE_LABEL) but SINGLE-LANGUAGE Arabic (the v2 app is
// Arabic/RTL only — the bilingual layer is dropped). Pure data, no behavior change. Used by
// the authed contract management UI (status/level chips) and the public e-sign view.

// Stage / level enum → Arabic label (drives the create-stage selector + detail panels).
export const CONTRACT_LEVELSENUM = [
  { enum: "LEVEL_1", label: "تحليل وتقييم" },
  { enum: "LEVEL_2", label: "تخطيط المساحات" },
  { enum: "LEVEL_3", label: "تصميم 3D" },
  { enum: "LEVEL_4", label: "مخططات تنفيذية" },
  { enum: "LEVEL_5", label: "حساب كميات واسعار" },
  { enum: "LEVEL_6", label: "تنفيذ" },
  { enum: "LEVEL_7", label: "تسويق" },
];

// level enum → { name(Arabic), color } for chips
export const CONTRACT_LEVEL = {
  null: { name: "لا يوجد مرحلة حاليا", color: "error" },
  LEVEL_1: { name: "تحليل وتقييم", color: "primary" },
  LEVEL_2: { name: "تخطيط المساحات", color: "info" },
  LEVEL_3: { name: "تصميم 3D", color: "secondary" },
  LEVEL_4: { name: "مخططات تنفيذية", color: "success" },
  LEVEL_5: { name: "حساب كميات واسعار", color: "warning" },
  LEVEL_6: { name: "تنفيذ", color: "error" },
  LEVEL_7: { name: "تسويق", color: "info" },
};

// contract.status → { name(Arabic), color }
export const CONTRACT_STATUS = {
  IN_PROGRESS: { name: "قيد التنفيذ", color: "warning" },
  COMPLETED: { name: "مكتمل", color: "success" },
  CANCELLED: { name: "ملغي", color: "error" },
};

// stage.stageStatus → { name(Arabic), color }
export const STAGE_STATUS = {
  NOT_STARTED: { name: "لم يبدأ", color: "default" },
  IN_PROGRESS: { name: "قيد التنفيذ", color: "warning" },
  COMPLETED: { name: "تم الإنجاز", color: "success" },
};

export const STAGE_STATUS_LABEL = {
  NOT_STARTED: "لم يبدأ",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "تم الإنجاز",
};

export const UAE_LABEL = "الإمارات العربية المتحدة";

export const EMIRATE_LABEL = {
  DUBAI: "دبي",
  ABU_DHABI: "أبوظبي",
  SHARJAH: "الشارقة",
  AJMAN: "عجمان",
  UMM_AL_QUWAIN: "أم القيوين",
  RAS_AL_KHAIMAH: "رأس الخيمة",
  FUJAIRAH: "الفجيرة",
  KHOR_FAKKAN: "خورفكان",
  OUTSIDE: "خارج الإمارات",
};

// Format an amount as AED in Arabic locale (ported from the legacy formatAED).
export function formatAED(value) {
  try {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat("ar-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${value} درهم`;
  }
}

// emirate-or-country label (Arabic). The country is a free string on the lead; we show it
// verbatim when no emirate (the bilingual COUNTRY_LABEL map is dropped — Arabic-only app).
export function emirateOrCountryLabel({ emirate, country }) {
  if (!emirate || emirate === "OUTSIDE") return country || "-";
  return `${EMIRATE_LABEL[emirate] || emirate} — ${UAE_LABEL}`;
}

// ════════════════════════════════════════════════════════════════════════════
//  Contract-payments overview (grouped) — copy + helpers
// ════════════════════════════════════════════════════════════════════════════
// Money formatter for the grouped contract-payments view. Kept VERBATIM from the legacy
// ContractPaymentsPage (en-AE locale, 2 fraction digits) so the observable money output is
// byte-identical — do NOT swap this for the page-wide ar-AE `formatAED` above (it uses 0
// fraction digits). This screen is the only consumer.
export function formatContractPaymentAED(value) {
  try {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch {
    return `AED ${Number(value || 0).toFixed(2)}`;
  }
}

// Status filter options for the grouped view (DUE default). VALUES are the Prisma enum
// keys; Arabic labels resolve via resolveStatusLabel("payment", value) at render time,
// except ALL which is a synthetic filter value (no enum / no label entry).
export const CONTRACT_PAYMENT_STATUS_FILTERS = ["DUE", "RECEIVED", "TRANSFERRED", "NOT_DUE", "ALL"];

// The ONLY statuses a user may SET on a payment (legacy constraint: NOT_DUE/DUE are
// system-managed and never user-selectable).
export const CONTRACT_PAYMENT_SETTABLE_STATUSES = ["RECEIVED", "TRANSFERRED"];

// Arabic copy constants for the grouped contract-payments overview (localized labels only —
// the legacy was English-labeled; data + actions are unchanged).
export const CONTRACT_PAYMENTS_COPY = {
  pageTitle: "دفعات العقود",
  pageSubtitle: "نظرة عامة على دفعات العقود حسب الحالة",
  filterAll: "الكل",
  filterLabel: "تصفية حسب الحالة",
  refresh: "تحديث",
  readonlyBanner: "لديك صلاحية العرض فقط",
  emptyTitle: "لا توجد دفعات بهذه الحالة",
  totalsReceived: "تم الاستلام",
  totalsTransferred: "تم التحويل",
  totalsDue: "مستحقة",
  totalsNotDue: "غير مستحقة",
  totalsGrand: "الإجمالي",
  totalsGrandWithTax: "الإجمالي شامل الضريبة",
  client: "العميل",
  taxRate: "الضريبة",
  amount: "المبلغ",
  withTax: "شامل الضريبة",
  amountLost: "المبلغ المفقود",
  amountReceived: "المبلغ المستلم",
  condition: "الشرط",
  noPaymentsForFilter: "لا توجد دفعات لهذه التصفية",
  setStatus: "تحديد الحالة",
  editAmounts: "تعديل المبالغ والحالة",
  statusGuard: "لا يمكن تغيير حالة الدفعات غير المستحقة",
  amountsGuard: "لا يمكن تعديل مبالغ الدفعات غير المستحقة",
  dialogTitle: "تعديل مبالغ الدفعة",
  originalWithTax: "المبلغ الأصلي شامل الضريبة",
  save: "حفظ",
  cancel: "إلغاء",
  lead: "العميل المحتمل",
};
