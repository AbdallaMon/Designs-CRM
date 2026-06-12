// Per-feature UI dictionary: user detail/editor page + its tabs (profile / account / roles /
// auto-assignments / settings / activity). Namespaced under "usersDetails.*".
//
// CONTRACT: ar is the existing/authoritative wording (verbatim); en is the additive translation.
// Excluded: backend message CODES (users/config/usersMessages.js) and the role-label enum map.

export const ar = {
  // ── page chrome / tabs ───────────────────────────────────────────────────────
  "usersDetails.tab.profile": "الملف الشخصي",
  "usersDetails.tab.account": "الحساب",
  "usersDetails.tab.roles": "الأدوار",
  "usersDetails.tab.assignments": "التعيينات التلقائية",
  "usersDetails.tab.settings": "الإعدادات",
  "usersDetails.tab.activity": "النشاط",
  "usersDetails.tab.commissions": "العمولات",
  "usersDetails.enter.deniedTitle": "هذا المستخدم غير متاح لصلاحياتك",
  "usersDetails.enter.deniedDescription": "لا تملك صلاحية عرض هذا الملف.",
  "usersDetails.header.fallback": "ملف المستخدم",
  "usersDetails.header.quick.commissions": "عمولات الموظف",
  "usersDetails.breadcrumbs.admin": "الإدارة",
  "usersDetails.breadcrumbs.users": "المستخدمون",
  "usersDetails.breadcrumbs.profile": "الملف الشخصي",
  "usersDetails.profileNotFound": "الملف غير موجود",

  // ── profile tab ──────────────────────────────────────────────────────────────
  "usersDetails.profile.loading": "جاري حفظ الملف الشخصي...",
  "usersDetails.profile.viewTitle": "بيانات الملف الشخصي",
  "usersDetails.profile.editTitle": "تعديل الملف الشخصي",
  "usersDetails.profile.field.name": "الاسم",
  "usersDetails.profile.field.email": "البريد الإلكتروني",
  "usersDetails.profile.field.role": "الدور",
  "usersDetails.profile.field.telegram": "معرّف تيليجرام",
  "usersDetails.profile.field.telegramOptional": "معرّف تيليجرام (اختياري)",
  "usersDetails.profile.validation.nameRequired": "الاسم مطلوب",
  "usersDetails.profile.save": "حفظ",

  // ── account tab ──────────────────────────────────────────────────────────────
  "usersDetails.account.saveLoading": "جاري حفظ الحساب...",
  "usersDetails.account.banLoading": "جاري الإيقاف...",
  "usersDetails.account.activateLoading": "جاري التفعيل...",
  "usersDetails.account.statusTitle": "حالة الحساب",
  "usersDetails.account.ban": "إيقاف المستخدم",
  "usersDetails.account.activate": "تفعيل المستخدم",
  "usersDetails.account.cannotToggle": "لا يمكنك تغيير حالة هذا الحساب.",
  "usersDetails.account.dataTitle": "بيانات الحساب",
  "usersDetails.account.field.name": "الاسم",
  "usersDetails.account.field.email": "البريد الإلكتروني",
  "usersDetails.account.field.role": "الدور",
  "usersDetails.account.field.telegram": "معرّف تيليجرام (اختياري)",
  "usersDetails.account.field.newPassword": "كلمة مرور جديدة (اتركها فارغة لعدم التغيير)",
  "usersDetails.account.validation.nameRequired": "الاسم مطلوب",
  "usersDetails.account.validation.emailInvalid": "صيغة البريد الإلكتروني غير صحيحة",
  "usersDetails.account.validation.passwordMin": "كلمة المرور 6 أحرف على الأقل",
  "usersDetails.account.save": "حفظ",
  "usersDetails.account.cannotEdit": "لا تملك صلاحية تعديل هذا الحساب.",

  // ── roles tab ────────────────────────────────────────────────────────────────
  "usersDetails.roles.loading": "جاري تحديث الأدوار...",
  "usersDetails.roles.deniedTitle": "إدارة الأدوار غير متاحة لصلاحياتك",
  "usersDetails.roles.deniedMessage": "لا تملك صلاحية تعديل أدوار هذا المستخدم.",
  "usersDetails.roles.title": "الأدوار الإضافية",
  "usersDetails.roles.subtitle": "حدّد الأدوار الفرعية الممنوحة لهذا المستخدم.",
  "usersDetails.roles.saveChanges": "حفظ التغييرات",
  "usersDetails.roles.added": "إضافة:",
  "usersDetails.roles.removed": "إزالة:",

  // ── auto-assignments tab ─────────────────────────────────────────────────────
  "usersDetails.assignments.loading": "جاري تحديث التعيينات...",
  "usersDetails.assignments.deniedTitle": "إدارة التعيينات التلقائية غير متاحة لصلاحياتك",
  "usersDetails.assignments.deniedMessage":
    "لا تملك صلاحية تعديل التعيينات التلقائية لهذا المستخدم.",
  "usersDetails.assignments.title": "التعيينات التلقائية",
  "usersDetails.assignments.subtitle": "أنواع المشاريع التي تُسنَد تلقائياً إلى هذا المستخدم.",
  "usersDetails.assignments.saveChanges": "حفظ التغييرات",
  "usersDetails.assignments.added": "إضافة:",
  "usersDetails.assignments.removed": "إزالة:",

  // ── settings tab ─────────────────────────────────────────────────────────────
  "usersDetails.settings.deniedTitle": "إعدادات المستخدم غير متاحة لصلاحياتك",
  "usersDetails.settings.deniedMessage": "لا تملك صلاحية تعديل إعدادات هذا المستخدم.",
  "usersDetails.settings.countries.loading": "جاري حفظ الدول المقيدة...",
  "usersDetails.settings.countries.title": "الدول المقيّدة",
  "usersDetails.settings.countries.subtitle": "الدول التي لا تُسنَد منها عملاء لهذا المستخدم.",
  "usersDetails.settings.countries.save": "حفظ",
  "usersDetails.settings.countries.field": "الدول",
  "usersDetails.settings.countries.placeholder": "أضف دولة ثم اضغط Enter",
  "usersDetails.settings.maxLeads.loading": "جاري تحديث الحد الأقصى...",
  "usersDetails.settings.maxLeadsPerDay.loading": "جاري تحديث الحد اليومي...",
  "usersDetails.settings.maxLeads.title": "حدود العملاء",
  "usersDetails.settings.maxLeads.validation.nonNegative": "رقم غير سالب",
  "usersDetails.settings.maxLeads.field.max": "الحد الأقصى للعملاء",
  "usersDetails.settings.maxLeads.field.perDay": "الحد الأقصى اليومي للعملاء",
  "usersDetails.settings.maxLeads.save": "حفظ",
  "usersDetails.settings.staffExtra.loading": "جاري تحديث بيانات الموظف...",
  "usersDetails.settings.staffExtra.title": "إعدادات الموظف",
  "usersDetails.settings.staffExtra.subtitle": "صلاحيات إضافية لموظفي المبيعات.",
  "usersDetails.settings.staffExtra.save": "حفظ",
  "usersDetails.settings.staffExtra.isPrimary": "موظف أساسي",
  "usersDetails.settings.staffExtra.isSuperSales": "مبيعات أول",
  "usersDetails.settings.staffExtra.note":
    "تُطبَّق هذه الإعدادات على موظفي المبيعات فقط؛ يتحقق الخادم من ذلك.",

  // ── activity tab ─────────────────────────────────────────────────────────────
  "usersDetails.activity.deniedTitle": "سجل النشاط غير متاح لصلاحياتك",
  "usersDetails.activity.deniedMessage": "لا تملك صلاحية عرض سجلّات هذا المستخدم.",
  "usersDetails.activity.logsTitle": "سجلّات اليوم",
  "usersDetails.activity.logsEmpty": "لا توجد سجلّات اليوم",
  "usersDetails.activity.lastSeenTitle": "آخر نشاط (شهري)",
  "usersDetails.activity.lastSeenEmpty": "لا يوجد نشاط مسجّل",
  "usersDetails.activity.recordPrefix": "سجل #",
};

export const en = {
  // ── page chrome / tabs ───────────────────────────────────────────────────────
  "usersDetails.tab.profile": "Profile",
  "usersDetails.tab.account": "Account",
  "usersDetails.tab.roles": "Roles",
  "usersDetails.tab.assignments": "Auto-assignments",
  "usersDetails.tab.settings": "Settings",
  "usersDetails.tab.activity": "Activity",
  "usersDetails.tab.commissions": "Commissions",
  "usersDetails.enter.deniedTitle": "This user is not available with your permissions",
  "usersDetails.enter.deniedDescription": "You don't have permission to view this profile.",
  "usersDetails.header.fallback": "User profile",
  "usersDetails.header.quick.commissions": "Employee commissions",
  "usersDetails.breadcrumbs.admin": "Administration",
  "usersDetails.breadcrumbs.users": "Users",
  "usersDetails.breadcrumbs.profile": "Profile",
  "usersDetails.profileNotFound": "Profile not found",

  // ── profile tab ──────────────────────────────────────────────────────────────
  "usersDetails.profile.loading": "Saving profile...",
  "usersDetails.profile.viewTitle": "Profile details",
  "usersDetails.profile.editTitle": "Edit profile",
  "usersDetails.profile.field.name": "Name",
  "usersDetails.profile.field.email": "Email",
  "usersDetails.profile.field.role": "Role",
  "usersDetails.profile.field.telegram": "Telegram username",
  "usersDetails.profile.field.telegramOptional": "Telegram username (optional)",
  "usersDetails.profile.validation.nameRequired": "Name is required",
  "usersDetails.profile.save": "Save",

  // ── account tab ──────────────────────────────────────────────────────────────
  "usersDetails.account.saveLoading": "Saving account...",
  "usersDetails.account.banLoading": "Banning...",
  "usersDetails.account.activateLoading": "Activating...",
  "usersDetails.account.statusTitle": "Account status",
  "usersDetails.account.ban": "Ban user",
  "usersDetails.account.activate": "Activate user",
  "usersDetails.account.cannotToggle": "You can't change this account's status.",
  "usersDetails.account.dataTitle": "Account details",
  "usersDetails.account.field.name": "Name",
  "usersDetails.account.field.email": "Email",
  "usersDetails.account.field.role": "Role",
  "usersDetails.account.field.telegram": "Telegram username (optional)",
  "usersDetails.account.field.newPassword": "New password (leave empty to keep unchanged)",
  "usersDetails.account.validation.nameRequired": "Name is required",
  "usersDetails.account.validation.emailInvalid": "Invalid email format",
  "usersDetails.account.validation.passwordMin": "Password must be at least 6 characters",
  "usersDetails.account.save": "Save",
  "usersDetails.account.cannotEdit": "You don't have permission to edit this account.",

  // ── roles tab ────────────────────────────────────────────────────────────────
  "usersDetails.roles.loading": "Updating roles...",
  "usersDetails.roles.deniedTitle": "Role management is not available with your permissions",
  "usersDetails.roles.deniedMessage": "You don't have permission to edit this user's roles.",
  "usersDetails.roles.title": "Additional roles",
  "usersDetails.roles.subtitle": "Select the sub-roles granted to this user.",
  "usersDetails.roles.saveChanges": "Save changes",
  "usersDetails.roles.added": "Added:",
  "usersDetails.roles.removed": "Removed:",

  // ── auto-assignments tab ─────────────────────────────────────────────────────
  "usersDetails.assignments.loading": "Updating assignments...",
  "usersDetails.assignments.deniedTitle":
    "Auto-assignment management is not available with your permissions",
  "usersDetails.assignments.deniedMessage":
    "You don't have permission to edit this user's auto-assignments.",
  "usersDetails.assignments.title": "Auto-assignments",
  "usersDetails.assignments.subtitle": "Project types automatically assigned to this user.",
  "usersDetails.assignments.saveChanges": "Save changes",
  "usersDetails.assignments.added": "Added:",
  "usersDetails.assignments.removed": "Removed:",

  // ── settings tab ─────────────────────────────────────────────────────────────
  "usersDetails.settings.deniedTitle": "User settings are not available with your permissions",
  "usersDetails.settings.deniedMessage": "You don't have permission to edit this user's settings.",
  "usersDetails.settings.countries.loading": "Saving restricted countries...",
  "usersDetails.settings.countries.title": "Restricted countries",
  "usersDetails.settings.countries.subtitle":
    "Countries from which leads are not assigned to this user.",
  "usersDetails.settings.countries.save": "Save",
  "usersDetails.settings.countries.field": "Countries",
  "usersDetails.settings.countries.placeholder": "Add a country then press Enter",
  "usersDetails.settings.maxLeads.loading": "Updating maximum...",
  "usersDetails.settings.maxLeadsPerDay.loading": "Updating daily limit...",
  "usersDetails.settings.maxLeads.title": "Lead limits",
  "usersDetails.settings.maxLeads.validation.nonNegative": "Non-negative number",
  "usersDetails.settings.maxLeads.field.max": "Maximum leads",
  "usersDetails.settings.maxLeads.field.perDay": "Maximum leads per day",
  "usersDetails.settings.maxLeads.save": "Save",
  "usersDetails.settings.staffExtra.loading": "Updating staff data...",
  "usersDetails.settings.staffExtra.title": "Staff settings",
  "usersDetails.settings.staffExtra.subtitle": "Extra privileges for sales staff.",
  "usersDetails.settings.staffExtra.save": "Save",
  "usersDetails.settings.staffExtra.isPrimary": "Primary staff",
  "usersDetails.settings.staffExtra.isSuperSales": "Super sales",
  "usersDetails.settings.staffExtra.note":
    "These settings apply to sales staff only; the server verifies this.",

  // ── activity tab ─────────────────────────────────────────────────────────────
  "usersDetails.activity.deniedTitle": "Activity log is not available with your permissions",
  "usersDetails.activity.deniedMessage": "You don't have permission to view this user's logs.",
  "usersDetails.activity.logsTitle": "Today's logs",
  "usersDetails.activity.logsEmpty": "No logs today",
  "usersDetails.activity.lastSeenTitle": "Last activity (monthly)",
  "usersDetails.activity.lastSeenEmpty": "No recorded activity",
  "usersDetails.activity.recordPrefix": "Record #",
};
