// Per-feature UI dictionary: generic utilities / fixed data
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "utilities.*" (e.g. "utilities.title", "utilities.actions.create"). The barrel
// (./index.js) deep-merges every stub's `ar` into one ar map and `en` into one en map, then
// uiDictionary merges those on top of its core keys. You do NOT edit the barrel or uiDictionary —
// just fill this file and call t("utilities.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording; en is the additive translation. Keep keys
// identical across ar and en. Arabic stays the default — an empty stub changes nothing.

export const ar = {
  // ── page chrome (UtilitiesPage) ─────────────────────────────────────────────
  "utilities.page.title": "الأدوات المساعدة",
  "utilities.page.subtitle": "بحث شامل، سجل العمل اليومي، والبيانات الثابتة.",
  "utilities.page.breadcrumb.admin": "الإدارة",
  "utilities.page.breadcrumb.tools": "أدوات",
  "utilities.page.denied.title": "الأدوات المساعدة غير متاحة لصلاحياتك",
  "utilities.page.denied.message":
    "لا تملك صلاحية الوصول إلى أيٍّ من أدوات النظام المساعدة. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها.",

  // ── tabs ────────────────────────────────────────────────────────────────────
  "utilities.tab.search": "بحث",
  "utilities.tab.userLog": "سجل اليوم",
  "utilities.tab.fixedData": "البيانات الثابتة",

  // ── global search panel ─────────────────────────────────────────────────────
  "utilities.search.title": "البحث الشامل",
  "utilities.search.subtitle":
    "ابحث عبر العملاء المحتملين والعملاء والمستخدمين، وانتقل مباشرة إلى السجل.",
  "utilities.search.modelLabel": "نوع السجل",
  "utilities.search.termLabel": "كلمة البحث",
  "utilities.search.submit": "بحث",
  "utilities.search.results.title": "النتائج",
  "utilities.search.results.count": "{count} نتيجة",
  "utilities.search.idle.title": "ابدأ البحث",
  "utilities.search.idle.description":
    "اختر نوع السجل واكتب كلمة البحث ثم اضغط «بحث» لعرض النتائج المطابقة.",
  "utilities.search.empty.title": "لا توجد نتائج",
  "utilities.search.empty.description":
    "لم يُعثر على أي «{label}» مطابق لكلمة البحث «{query}». جرّب كلمة أخرى.",

  // ── search model definitions (labels + placeholders) ────────────────────────
  "utilities.search.model.clientLead.label": "العملاء المحتملون",
  "utilities.search.model.clientLead.placeholder":
    "ابحث بالاسم أو البريد أو الهاتف أو الكود أو الرقم",
  "utilities.search.model.clientLead.codePrefix": "كود: {code}",
  "utilities.search.model.client.label": "العملاء",
  "utilities.search.model.client.placeholder": "ابحث بالاسم أو البريد أو الهاتف",
  "utilities.search.model.user.label": "المستخدمون",
  "utilities.search.model.user.placeholder": "ابحث بالاسم أو البريد",

  // ── user-log form ───────────────────────────────────────────────────────────
  "utilities.userLog.title": "سجل العمل اليومي",
  "utilities.userLog.subtitle": "لم تُسجّل عملك لهذا اليوم بعد — أدخل التفاصيل ثم احفظ.",
  "utilities.userLog.loadingToast": "جاري تسجيل سجل العمل...",
  "utilities.userLog.success.title": "تم تسجيل سجل اليوم",
  "utilities.userLog.success.message": "تم حفظ سجل عملك لهذا اليوم بنجاح.",
  "utilities.userLog.existing.title": "تم تسجيل سجل اليوم",
  "utilities.userLog.existing.message":
    "لقد سجّلت عملك لهذا اليوم بالفعل. يمكنك العودة غداً لتسجيل يوم جديد.",
  "utilities.userLog.partial.title": "لا يوجد سجل لهذا اليوم",
  "utilities.userLog.partial.message":
    "لم تُسجّل عملك لهذا اليوم بعد، ولا تملك صلاحية تسجيل سجل العمل. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تملكها.",
  "utilities.userLog.field.date": "التاريخ",
  "utilities.userLog.field.date.required": "التاريخ مطلوب",
  "utilities.userLog.field.description": "وصف العمل",
  "utilities.userLog.field.description.placeholder": "اكتب ما أنجزته اليوم",
  "utilities.userLog.field.description.required": "وصف العمل مطلوب",
  "utilities.userLog.field.minutes": "إجمالي الدقائق (اختياري)",
  "utilities.userLog.field.minutes.invalid": "أدخل عدد دقائق صحيح (0 أو أكثر)",
  "utilities.userLog.submit": "حفظ سجل اليوم",

  // ── fixed-data list ─────────────────────────────────────────────────────────
  "utilities.fixedData.empty.title": "لا توجد بيانات ثابتة",
  "utilities.fixedData.empty.description": "لم تُضَف أي بيانات ثابتة بعد.",
  "utilities.fixedData.col.id": "المعرّف",
  "utilities.fixedData.col.title": "العنوان",
  "utilities.fixedData.filter.search": "بحث في البيانات الثابتة",
  "utilities.fixedData.filter.placeholder": "اكتب للتصفية",
};

export const en = {
  // ── page chrome (UtilitiesPage) ─────────────────────────────────────────────
  "utilities.page.title": "Utilities",
  "utilities.page.subtitle": "Global search, daily work log, and fixed data.",
  "utilities.page.breadcrumb.admin": "Administration",
  "utilities.page.breadcrumb.tools": "Tools",
  "utilities.page.denied.title": "Utilities are not available for your permissions",
  "utilities.page.denied.message":
    "You don't have permission to access any of the system's helper tools. Contact the administrator if you think you should.",

  // ── tabs ────────────────────────────────────────────────────────────────────
  "utilities.tab.search": "Search",
  "utilities.tab.userLog": "Today's Log",
  "utilities.tab.fixedData": "Fixed Data",

  // ── global search panel ─────────────────────────────────────────────────────
  "utilities.search.title": "Global Search",
  "utilities.search.subtitle":
    "Search across leads, clients, and users, and jump straight to the record.",
  "utilities.search.modelLabel": "Record type",
  "utilities.search.termLabel": "Search term",
  "utilities.search.submit": "Search",
  "utilities.search.results.title": "Results",
  "utilities.search.results.count": "{count} results",
  "utilities.search.idle.title": "Start searching",
  "utilities.search.idle.description":
    "Pick a record type, type a search term, then press “Search” to see matching results.",
  "utilities.search.empty.title": "No results",
  "utilities.search.empty.description":
    "No “{label}” matching the search term “{query}” was found. Try another term.",

  // ── search model definitions (labels + placeholders) ────────────────────────
  "utilities.search.model.clientLead.label": "Leads",
  "utilities.search.model.clientLead.placeholder": "Search by name, email, phone, code, or number",
  "utilities.search.model.clientLead.codePrefix": "Code: {code}",
  "utilities.search.model.client.label": "Clients",
  "utilities.search.model.client.placeholder": "Search by name, email, or phone",
  "utilities.search.model.user.label": "Users",
  "utilities.search.model.user.placeholder": "Search by name or email",

  // ── user-log form ───────────────────────────────────────────────────────────
  "utilities.userLog.title": "Daily Work Log",
  "utilities.userLog.subtitle": "You haven't logged your work for today yet — enter the details and save.",
  "utilities.userLog.loadingToast": "Saving work log...",
  "utilities.userLog.success.title": "Today's log saved",
  "utilities.userLog.success.message": "Your work log for today has been saved successfully.",
  "utilities.userLog.existing.title": "Today's log saved",
  "utilities.userLog.existing.message":
    "You have already logged your work for today. You can come back tomorrow to log a new day.",
  "utilities.userLog.partial.title": "No log for today",
  "utilities.userLog.partial.message":
    "You haven't logged your work for today yet, and you don't have permission to submit a work log. Contact the administrator if you think you should.",
  "utilities.userLog.field.date": "Date",
  "utilities.userLog.field.date.required": "Date is required",
  "utilities.userLog.field.description": "Work description",
  "utilities.userLog.field.description.placeholder": "Write what you accomplished today",
  "utilities.userLog.field.description.required": "Work description is required",
  "utilities.userLog.field.minutes": "Total minutes (optional)",
  "utilities.userLog.field.minutes.invalid": "Enter a valid number of minutes (0 or more)",
  "utilities.userLog.submit": "Save today's log",

  // ── fixed-data list ─────────────────────────────────────────────────────────
  "utilities.fixedData.empty.title": "No fixed data",
  "utilities.fixedData.empty.description": "No fixed data has been added yet.",
  "utilities.fixedData.col.id": "ID",
  "utilities.fixedData.col.title": "Title",
  "utilities.fixedData.filter.search": "Search fixed data",
  "utilities.fixedData.filter.placeholder": "Type to filter",
};
