// Accounting feature display constants — single-language (Arabic), mirroring the legacy
// enum label maps (ui/src/app/helpers/constants.js PaymentLevels/PaymentStatus/
// ThreeDWorkStages/userRolesEnum) but translated to Arabic for the v2 single-language UI.
// The KEYS byte-match the frozen Prisma enum values the backend returns; only the labels
// are localized. These drive chips/columns/kanban columns/selects.

// PaymentLevel enum (schema.prisma) — the payment-level kanban columns + change-status select.
export const PAYMENT_LEVELS = {
  LEVEL_1: "الدفعة الأولى",
  LEVEL_2: "الدفعة الثانية",
  LEVEL_3: "الدفعة الثالثة",
  LEVEL_4: "الدفعة الرابعة",
  LEVEL_5: "الدفعة الخامسة",
  LEVEL_6: "الدفعة السادسة",
  LEVEL_7_OR_MORE: "الدفعة السابعة أو أكثر",
};

// PaymentStatus enum (schema.prisma).
export const PAYMENT_STATUS = {
  PENDING: "قيد الانتظار",
  PARTIALLY_PAID: "مدفوعة جزئياً",
  FULLY_PAID: "مدفوعة بالكامل",
  OVERDUE: "متأخرة",
};

// ThreeDWorkStage enum (schema.prisma) — the 3d-status kanban columns (read-only board).
export const THREE_D_WORK_STAGES = {
  CLIENT_COMMUNICATION: "التواصل مع العميل",
  DESIGN_STAGE: "مرحلة التصميم",
  FIRST_MODIFICATION: "التعديل الأول",
  SECOND_MODIFICATION: "التعديل الثاني",
  THIRD_MODIFICATION: "التعديل الثالث",
  THREE_D_APPROVAL: "اعتماد التصميم ثلاثي الأبعاد",
};

// User role enum — salaries directory column.
export const USER_ROLES = {
  STAFF: "موظف مبيعات",
  THREE_D_DESIGNER: "مصمم ثلاثي الأبعاد",
  TWO_D_DESIGNER: "مصمم ثنائي الأبعاد",
  ACCOUNTANT: "محاسب",
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
  SUPER_SALES: "مدير مبيعات",
  CONTACT_INITIATOR: "مسؤول تواصل",
  TWO_D_EXECUTOR: "منفذ ثنائي الأبعاد",
};

// Account-status boolean labels (salaries directory).
export const ACCOUNT_STATUS = { TRUE: "نشط", FALSE: "محظور" };

// The accounting feature's sub-views (was the legacy @accountant/* role-slot routes).
// Drives the in-page view switcher; the URL carries `?view=`.
export const ACCOUNTING_VIEWS = {
  payments: "الدفعات",
  threeD: "حالة التصميم 3D",
  overdue: "الدفعات المتأخرة",
  paid: "الدفعات المدفوعة",
  expenses: "المصروفات التشغيلية",
  rents: "الإيجارات",
  salaries: "الرواتب",
  outcome: "المصروفات",
};

// Format an amount as AED currency (matches the legacy en-AE / en-US currency formatting
// intent; AED is the studio currency used by the outcome/summary cards).
export function formatCurrency(amount, currency = "AED") {
  const n = Number(amount);
  return new Intl.NumberFormat("ar-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}
