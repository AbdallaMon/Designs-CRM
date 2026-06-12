// Per-feature UI dictionary: users list + create modal + user constants.
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "users.*". The barrel (./index.js) deep-merges every stub's `ar` into one ar
// map and `en` into one en map. Call t("users.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording (verbatim); en is the additive translation.
// Excluded from this file: backend message CODES (config/usersMessages.js), the role-label enum
// VALUE map (features/shell/roleLabels.js), and toast-runner default strings (users.mutations.js).

export const ar = {
  // ── list page ──────────────────────────────────────────────────────────────
  "users.title": "المستخدمون",
  "users.totalPrefix": "الإجمالي:",
  "users.breadcrumbs.admin": "الإدارة",
  "users.breadcrumbs.users": "المستخدمون",
  "users.actions.create": "إنشاء مستخدم",
  "users.actions.openUserFile": "فتح ملف المستخدم",
  "users.actions.ban": "إيقاف المستخدم",
  "users.actions.unban": "تفعيل المستخدم",
  "users.toast.banning": "جاري الإيقاف...",
  "users.toast.activating": "جاري التفعيل...",
  "users.empty.title": "لا يوجد مستخدمون",
  "users.empty.descriptionCanCreate": "ابدأ بإنشاء أول مستخدم لإدارة الفريق.",
  "users.empty.descriptionNoMatch": "لا توجد سجلات مطابقة للتصفية الحالية.",
  "users.denied.title": "إدارة المستخدمين غير متاحة لصلاحياتك",
  "users.denied.message":
    "لا تملك صلاحية عرض قائمة المستخدمين. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها.",

  // ── columns ────────────────────────────────────────────────────────────────
  "users.columns.id": "الرقم",
  "users.columns.name": "الاسم",
  "users.columns.email": "البريد الإلكتروني",
  "users.columns.role": "الدور",
  "users.columns.status": "الحالة",
  "users.columns.createdAt": "تاريخ الإنشاء",

  // ── filters ────────────────────────────────────────────────────────────────
  "users.filters.search.label": "بحث برقم المستخدم",
  "users.filters.search.placeholder": "رقم المستخدم",
  "users.filters.status.label": "الحالة",
  "users.filters.status.all": "كل الحالات",

  // ── status buckets / options ─────────────────────────────────────────────────
  "users.status.active": "نشط",
  "users.status.banned": "موقوف",

  // ── auto-assignment type labels ──────────────────────────────────────────────
  "users.autoAssignment.3dDesigner": "تصميم ثلاثي الأبعاد",
  "users.autoAssignment.3dModification": "تعديل ثلاثي الأبعاد",
  "users.autoAssignment.2dStudy": "دراسة ثنائية الأبعاد",
  "users.autoAssignment.2dFinalPlans": "مخططات نهائية ثنائية الأبعاد",
  "users.autoAssignment.2dQuantity": "حساب الكميات ثنائي الأبعاد",

  // ── create modal ─────────────────────────────────────────────────────────────
  "users.create.title": "إنشاء مستخدم",
  "users.create.loading": "جاري إنشاء المستخدم...",
  "users.create.field.name": "الاسم",
  "users.create.field.email": "البريد الإلكتروني",
  "users.create.field.password": "كلمة المرور",
  "users.create.field.role": "الدور",
  "users.create.field.telegram": "معرّف تيليجرام (اختياري)",
  "users.create.validation.nameRequired": "الاسم مطلوب",
  "users.create.validation.emailRequired": "البريد الإلكتروني مطلوب",
  "users.create.validation.emailInvalid": "صيغة البريد الإلكتروني غير صحيحة",
  "users.create.validation.passwordRequired": "كلمة المرور مطلوبة",
  "users.create.validation.passwordMin": "كلمة المرور 6 أحرف على الأقل",
  "users.create.validation.roleRequired": "الدور مطلوب",
  "users.create.cancel": "إلغاء",
  "users.create.submit": "إنشاء",
};

export const en = {
  // ── list page ──────────────────────────────────────────────────────────────
  "users.title": "Users",
  "users.totalPrefix": "Total:",
  "users.breadcrumbs.admin": "Administration",
  "users.breadcrumbs.users": "Users",
  "users.actions.create": "Create User",
  "users.actions.openUserFile": "Open user profile",
  "users.actions.ban": "Ban user",
  "users.actions.unban": "Activate user",
  "users.toast.banning": "Banning...",
  "users.toast.activating": "Activating...",
  "users.empty.title": "No users",
  "users.empty.descriptionCanCreate": "Start by creating your first user to manage the team.",
  "users.empty.descriptionNoMatch": "No records match the current filters.",
  "users.denied.title": "User management is not available with your permissions",
  "users.denied.message":
    "You don't have permission to view the users list. Contact your administrator if you think you should have access.",

  // ── columns ────────────────────────────────────────────────────────────────
  "users.columns.id": "ID",
  "users.columns.name": "Name",
  "users.columns.email": "Email",
  "users.columns.role": "Role",
  "users.columns.status": "Status",
  "users.columns.createdAt": "Created",

  // ── filters ────────────────────────────────────────────────────────────────
  "users.filters.search.label": "Search by user ID",
  "users.filters.search.placeholder": "User ID",
  "users.filters.status.label": "Status",
  "users.filters.status.all": "All statuses",

  // ── status buckets / options ─────────────────────────────────────────────────
  "users.status.active": "Active",
  "users.status.banned": "Banned",

  // ── auto-assignment type labels ──────────────────────────────────────────────
  "users.autoAssignment.3dDesigner": "3D Design",
  "users.autoAssignment.3dModification": "3D Modification",
  "users.autoAssignment.2dStudy": "2D Study",
  "users.autoAssignment.2dFinalPlans": "2D Final Plans",
  "users.autoAssignment.2dQuantity": "2D Quantity Calculation",

  // ── create modal ─────────────────────────────────────────────────────────────
  "users.create.title": "Create User",
  "users.create.loading": "Creating user...",
  "users.create.field.name": "Name",
  "users.create.field.email": "Email",
  "users.create.field.password": "Password",
  "users.create.field.role": "Role",
  "users.create.field.telegram": "Telegram username (optional)",
  "users.create.validation.nameRequired": "Name is required",
  "users.create.validation.emailRequired": "Email is required",
  "users.create.validation.emailInvalid": "Invalid email format",
  "users.create.validation.passwordRequired": "Password is required",
  "users.create.validation.passwordMin": "Password must be at least 6 characters",
  "users.create.validation.roleRequired": "Role is required",
  "users.create.cancel": "Cancel",
  "users.create.submit": "Create",
};
