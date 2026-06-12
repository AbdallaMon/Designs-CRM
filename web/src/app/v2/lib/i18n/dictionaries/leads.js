// Per-feature UI dictionary: leads list / sales pipeline / workspace cockpit.
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "leads.*". The barrel (./index.js) deep-merges every stub's `ar` into one ar
// map and `en` into one en map, then uiDictionary merges those on top of its core keys. You do
// NOT edit the barrel or uiDictionary — just fill this file and call t("leads.<key>") in the
// feature's components.
//
// CONTRACT: ar is the existing/authoritative wording (verbatim from the components it replaces),
// so ar renders identically. en is the additive natural translation. Keys identical across ar/en.

export const ar = {
  // ── list page: header / view toggle / segments ──────────────────────────────
  "leads.page.title": "العملاء المحتملون",
  "leads.page.title.deals": "الصفقات الحالية",
  "leads.page.breadcrumb.sales": "المبيعات",
  "leads.page.subtitle.kanban": "لوحة الصفقات",
  "leads.page.subtitle.total": "الإجمالي: {total}",
  "leads.view.aria": "طريقة العرض",
  "leads.view.list": "قائمة",
  "leads.view.list.aria": "عرض قائمة",
  "leads.view.kanban": "لوحة",
  "leads.view.kanban.aria": "عرض لوحة",
  "leads.action.bulkConvert.tooltip": "تحويل العملاء المحددين تحويلاً جماعياً",
  "leads.action.bulkConvert.label": "تحويل جماعي ({count})",
  "leads.action.refresh": "تحديث",
  "leads.action.openDetails": "فتح التفاصيل",
  "leads.row.selectAria": "تحديد العميل {id}",
  "leads.segment.new": "العملاء الجدد",
  "leads.segment.deals": "الصفقات",
  "leads.segment.filteredChip": "مفلتر حسب الحالة",

  // ── list page: empty states ─────────────────────────────────────────────────
  "leads.empty.status.title": "لا توجد نتائج مطابقة للحالة المحددة",
  "leads.empty.status.description": "غيّر الحالة من شريط التصفية أو أعد التعيين لعرض القائمة كاملة.",
  "leads.empty.new.title": "لا يوجد عملاء جدد بانتظار الاستلام",
  "leads.empty.new.description": "ستظهر هنا العملاء الجدد فور وصولهم. لا حاجة لإجراء الآن.",
  "leads.empty.deals.title": "لا توجد صفقات مطابقة",
  "leads.empty.deals.description": "لا توجد صفقات في هذا القسم حالياً.",

  // ── list page: access denied ────────────────────────────────────────────────
  "leads.denied.title": "قائمة العملاء غير متاحة لصلاحياتك",
  "leads.denied.message":
    "لا تملك صلاحية الوصول إلى قائمة العملاء المحتملين. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها.",

  // ── columns ─────────────────────────────────────────────────────────────────
  "leads.columns.id": "الرقم",
  "leads.columns.client": "العميل",
  "leads.columns.phone": "الهاتف",
  "leads.columns.category": "التصنيف",
  "leads.columns.status": "الحالة",
  "leads.columns.paymentStatus": "حالة الدفع",
  "leads.columns.createdAt": "تاريخ الإنشاء",

  // ── filters ─────────────────────────────────────────────────────────────────
  "leads.filters.status.label": "الحالة",
  "leads.filters.status.all": "كل الحالات",

  // ── search autocomplete ─────────────────────────────────────────────────────
  "leads.search.label": "ابحث عن عميل بالاسم أو الهاتف أو البريد",
  "leads.search.loading": "جاري البحث...",
  "leads.search.minChars": "اكتب حرفين على الأقل",
  "leads.search.noResults": "لا توجد نتائج",

  // ── bulk-convert modal ──────────────────────────────────────────────────────
  "leads.bulk.title": "تحويل جماعي",
  "leads.bulk.selectedCount": "عدد العملاء المحددين: {count}",
  "leads.bulk.userIdLabel": "رقم الموظف المستلم",
  "leads.bulk.cancel": "إلغاء",
  "leads.bulk.convert": "تحويل",
  "leads.bulk.loading": "جاري التحويل الجماعي...",

  // ── workspace cockpit ───────────────────────────────────────────────────────
  "leads.workspace.denied.title": "مساحة العمل غير متاحة لصلاحياتك",
  "leads.workspace.denied.message":
    "لا تملك صلاحية الوصول إلى قائمة العملاء. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليها.",
  "leads.workspace.title": "مساحة عملي",
  "leads.workspace.subtitle":
    "متابعتك اليومية: المكالمات والاجتماعات القادمة والعملاء الجدد والصفقات المعلّقة.",
  "leads.workspace.summary.calls": "مكالمات اليوم",
  "leads.workspace.summary.meetings": "اجتماعات اليوم",
  "leads.workspace.summary.newLeads": "عملاء جدد",
  "leads.workspace.calls.title": "المكالمات القادمة",
  "leads.workspace.calls.empty.title": "لا مكالمات اليوم",
  "leads.workspace.calls.empty.description": "لا توجد مكالمات قادمة بانتظارك الآن — عمل رائع!",
  "leads.workspace.meetings.title": "الاجتماعات القادمة",
  "leads.workspace.meetings.empty.title": "لا اجتماعات اليوم",
  "leads.workspace.meetings.empty.description": "لا توجد اجتماعات قادمة مجدولة حالياً.",
  "leads.workspace.newLeads.title": "العملاء الجدد",
  "leads.workspace.newLeads.viewAll": "كل العملاء",
  "leads.workspace.newLeads.empty.title": "لا عملاء جدد",
  "leads.workspace.newLeads.empty.description": "لا يوجد عملاء جدد بانتظار الاستلام الآن.",
  "leads.workspace.onHold.title": "صفقات معلّقة",
  "leads.workspace.onHold.viewAll": "كل الصفقات",
  "leads.workspace.onHold.empty.title": "لا صفقات معلّقة",
  "leads.workspace.onHold.empty.description": "لا توجد صفقات معلّقة تحتاج متابعة.",

  // ── workspace section card (5-state chrome) ─────────────────────────────────
  "leads.section.denied.title": "هذا القسم غير متاح لصلاحياتك",
  "leads.section.denied.message":
    "لا تملك صلاحية عرض هذا القسم. تواصل مع المسؤول إن كنت تظن أنه ينبغي أن تصل إليه.",
  "leads.section.empty.title": "لا توجد بيانات",

  // ── reminder row ────────────────────────────────────────────────────────────
  "leads.reminder.unknownClient": "عميل غير معروف",
  "leads.reminder.noTime": "بدون موعد محدد",
  "leads.reminder.done": "تمت",
  "leads.reminder.call.loading": "جاري تحديث المكالمة...",
  "leads.reminder.meeting.loading": "جاري تحديث الاجتماع...",

  // ── assign / convert actions ────────────────────────────────────────────────
  "leads.assign.claim": "استلام العميل",
  "leads.assign.convert": "تحويل إلى صفقة",
  "leads.assign.cancel": "إلغاء",
  "leads.assign.claim.loading": "جاري الإسناد...",
  "leads.assign.convert.loading": "جاري التحويل...",
  "leads.assign.claim.confirmTitle": "تأكيد استلام العميل؟",
  "leads.assign.claim.confirmBody": 'سيتم إسناد العميل "{name}" إليك.',
  "leads.assign.claim.confirmLabel": "استلام",
  "leads.assign.convert.confirmTitle": "تأكيد التحويل إلى صفقة؟",
  "leads.assign.convert.confirmBody": 'سيتم تحويل العميل "{name}" إلى صفقة.',
  "leads.assign.convert.confirmLabel": "تحويل",

  // ── admin assign-to-staff action ────────────────────────────────────────────
  "leads.adminAssign.button": "إسناد لموظف",
  "leads.adminAssign.title": "إسناد العميل لموظف",
  "leads.adminAssign.client": "العميل: {name}",
  "leads.adminAssign.loadingStaff": "جاري التحميل...",
  "leads.adminAssign.noStaff": "لا يوجد موظفون",
  "leads.adminAssign.selectStaff": "اختر الموظف",
  "leads.adminAssign.cancel": "إلغاء",
  "leads.adminAssign.assign": "إسناد",
  "leads.adminAssign.loading": "جاري الإسناد للموظف...",

  // ── kanban board ────────────────────────────────────────────────────────────
  "leads.kanban.cardFallback": "عميل",
  "leads.kanban.owner": "المسؤول: {name}",
  "leads.kanban.openClient": "فتح ملف العميل",
  "leads.kanban.readonlyTooltip": "قائمة للقراءة فقط — لا يمكن النقل إليها",
  "leads.kanban.refreshColumn": "تحديث القائمة",
  "leads.kanban.refreshColumnAria": "تحديث {status}",
  "leads.kanban.columnError": "تعذّر تحميل القائمة",
  "leads.kanban.columnEmpty": "لا يوجد عملاء في هذه القائمة",
  "leads.kanban.hint": "اسحب بطاقة العميل إلى قائمة أخرى لتغيير حالتها.",
  "leads.kanban.refreshBoard": "تحديث اللوحة كاملة",
  "leads.kanban.refreshBoardAria": "تحديث اللوحة",
  "leads.kanban.changeStatus.loading": "جاري تغيير الحالة...",

  // ── booking lead details card ───────────────────────────────────────────────
  "leads.booking.title": "تفاصيل الحجز",

  // ── admin create-lead option sets (category / item / emirate selects) ────────
  "leads.create.category.DESIGN": "تصميم",
  "leads.create.category.CONSULTATION": "استشارة",
  "leads.create.item.RESIDENTIAL": "سكني",
  "leads.create.item.COMMERCIAL": "تجاري",
  "leads.create.item.ROOM": "غرفة",
  "leads.create.item.BLUEPRINT": "مخطط",
  "leads.create.item.CITY_VISIT": "زيارة ميدانية",
  "leads.emirate.DUBAI": "دبي",
  "leads.emirate.ABU_DHABI": "أبوظبي",
  "leads.emirate.SHARJAH": "الشارقة",
  "leads.emirate.AJMAN": "عجمان",
  "leads.emirate.UMM_AL_QUWAIN": "أم القيوين",
  "leads.emirate.RAS_AL_KHAIMAH": "رأس الخيمة",
  "leads.emirate.FUJAIRAH": "الفجيرة",
};

export const en = {
  // ── list page: header / view toggle / segments ──────────────────────────────
  "leads.page.title": "Potential clients",
  "leads.page.title.deals": "Current deals",
  "leads.page.breadcrumb.sales": "Sales",
  "leads.page.subtitle.kanban": "Deals board",
  "leads.page.subtitle.total": "Total: {total}",
  "leads.view.aria": "View mode",
  "leads.view.list": "List",
  "leads.view.list.aria": "List view",
  "leads.view.kanban": "Board",
  "leads.view.kanban.aria": "Board view",
  "leads.action.bulkConvert.tooltip": "Bulk-convert the selected leads",
  "leads.action.bulkConvert.label": "Bulk convert ({count})",
  "leads.action.refresh": "Refresh",
  "leads.action.openDetails": "Open details",
  "leads.row.selectAria": "Select lead {id}",
  "leads.segment.new": "New leads",
  "leads.segment.deals": "Deals",
  "leads.segment.filteredChip": "Filtered by status",

  // ── list page: empty states ─────────────────────────────────────────────────
  "leads.empty.status.title": "No results match the selected status",
  "leads.empty.status.description": "Change the status from the filter bar or reset to view the full list.",
  "leads.empty.new.title": "No new leads awaiting pickup",
  "leads.empty.new.description": "New leads will appear here as soon as they arrive. No action needed now.",
  "leads.empty.deals.title": "No matching deals",
  "leads.empty.deals.description": "There are no deals in this section currently.",

  // ── list page: access denied ────────────────────────────────────────────────
  "leads.denied.title": "The leads list is not available for your permissions",
  "leads.denied.message":
    "You don't have permission to access the leads list. Contact the administrator if you think you should.",

  // ── columns ─────────────────────────────────────────────────────────────────
  "leads.columns.id": "ID",
  "leads.columns.client": "Client",
  "leads.columns.phone": "Phone",
  "leads.columns.category": "Category",
  "leads.columns.status": "Status",
  "leads.columns.paymentStatus": "Payment status",
  "leads.columns.createdAt": "Created at",

  // ── filters ─────────────────────────────────────────────────────────────────
  "leads.filters.status.label": "Status",
  "leads.filters.status.all": "All statuses",

  // ── search autocomplete ─────────────────────────────────────────────────────
  "leads.search.label": "Search a lead by name, phone, or email",
  "leads.search.loading": "Searching...",
  "leads.search.minChars": "Type at least two characters",
  "leads.search.noResults": "No results",

  // ── bulk-convert modal ──────────────────────────────────────────────────────
  "leads.bulk.title": "Bulk convert",
  "leads.bulk.selectedCount": "Selected leads: {count}",
  "leads.bulk.userIdLabel": "Receiving employee ID",
  "leads.bulk.cancel": "Cancel",
  "leads.bulk.convert": "Convert",
  "leads.bulk.loading": "Bulk converting...",

  // ── workspace cockpit ───────────────────────────────────────────────────────
  "leads.workspace.denied.title": "The workspace is not available for your permissions",
  "leads.workspace.denied.message":
    "You don't have permission to access the leads list. Contact the administrator if you think you should.",
  "leads.workspace.title": "My Workspace",
  "leads.workspace.subtitle":
    "Your daily follow-up: upcoming calls and meetings, new leads, and deals on hold.",
  "leads.workspace.summary.calls": "Today's calls",
  "leads.workspace.summary.meetings": "Today's meetings",
  "leads.workspace.summary.newLeads": "New leads",
  "leads.workspace.calls.title": "Upcoming calls",
  "leads.workspace.calls.empty.title": "No calls today",
  "leads.workspace.calls.empty.description": "No upcoming calls awaiting you right now — great work!",
  "leads.workspace.meetings.title": "Upcoming meetings",
  "leads.workspace.meetings.empty.title": "No meetings today",
  "leads.workspace.meetings.empty.description": "No upcoming meetings scheduled currently.",
  "leads.workspace.newLeads.title": "New leads",
  "leads.workspace.newLeads.viewAll": "All leads",
  "leads.workspace.newLeads.empty.title": "No new leads",
  "leads.workspace.newLeads.empty.description": "No new leads awaiting pickup right now.",
  "leads.workspace.onHold.title": "Deals on hold",
  "leads.workspace.onHold.viewAll": "All deals",
  "leads.workspace.onHold.empty.title": "No deals on hold",
  "leads.workspace.onHold.empty.description": "No on-hold deals need follow-up.",

  // ── workspace section card (5-state chrome) ─────────────────────────────────
  "leads.section.denied.title": "This section is not available for your permissions",
  "leads.section.denied.message":
    "You don't have permission to view this section. Contact the administrator if you think you should.",
  "leads.section.empty.title": "No data",

  // ── reminder row ────────────────────────────────────────────────────────────
  "leads.reminder.unknownClient": "Unknown client",
  "leads.reminder.noTime": "No time set",
  "leads.reminder.done": "Done",
  "leads.reminder.call.loading": "Updating the call...",
  "leads.reminder.meeting.loading": "Updating the meeting...",

  // ── assign / convert actions ────────────────────────────────────────────────
  "leads.assign.claim": "Claim lead",
  "leads.assign.convert": "Convert to deal",
  "leads.assign.cancel": "Cancel",
  "leads.assign.claim.loading": "Assigning...",
  "leads.assign.convert.loading": "Converting...",
  "leads.assign.claim.confirmTitle": "Confirm claiming the lead?",
  "leads.assign.claim.confirmBody": 'The lead "{name}" will be assigned to you.',
  "leads.assign.claim.confirmLabel": "Claim",
  "leads.assign.convert.confirmTitle": "Confirm converting to a deal?",
  "leads.assign.convert.confirmBody": 'The lead "{name}" will be converted to a deal.',
  "leads.assign.convert.confirmLabel": "Convert",

  // ── admin assign-to-staff action ────────────────────────────────────────────
  "leads.adminAssign.button": "Assign to staff",
  "leads.adminAssign.title": "Assign the lead to a staff member",
  "leads.adminAssign.client": "Client: {name}",
  "leads.adminAssign.loadingStaff": "Loading...",
  "leads.adminAssign.noStaff": "No staff members",
  "leads.adminAssign.selectStaff": "Select a staff member",
  "leads.adminAssign.cancel": "Cancel",
  "leads.adminAssign.assign": "Assign",
  "leads.adminAssign.loading": "Assigning to staff...",

  // ── kanban board ────────────────────────────────────────────────────────────
  "leads.kanban.cardFallback": "Lead",
  "leads.kanban.owner": "Owner: {name}",
  "leads.kanban.openClient": "Open client file",
  "leads.kanban.readonlyTooltip": "Read-only list — cannot move items here",
  "leads.kanban.refreshColumn": "Refresh the list",
  "leads.kanban.refreshColumnAria": "Refresh {status}",
  "leads.kanban.columnError": "Failed to load the list",
  "leads.kanban.columnEmpty": "No leads in this list",
  "leads.kanban.hint": "Drag a lead card to another list to change its status.",
  "leads.kanban.refreshBoard": "Refresh the whole board",
  "leads.kanban.refreshBoardAria": "Refresh the board",
  "leads.kanban.changeStatus.loading": "Changing status...",

  // ── booking lead details card ───────────────────────────────────────────────
  "leads.booking.title": "Booking details",

  // ── admin create-lead option sets (category / item / emirate selects) ────────
  "leads.create.category.DESIGN": "Design",
  "leads.create.category.CONSULTATION": "Consultation",
  "leads.create.item.RESIDENTIAL": "Residential",
  "leads.create.item.COMMERCIAL": "Commercial",
  "leads.create.item.ROOM": "Room",
  "leads.create.item.BLUEPRINT": "Blueprint",
  "leads.create.item.CITY_VISIT": "Site visit",
  "leads.emirate.DUBAI": "Dubai",
  "leads.emirate.ABU_DHABI": "Abu Dhabi",
  "leads.emirate.SHARJAH": "Sharjah",
  "leads.emirate.AJMAN": "Ajman",
  "leads.emirate.UMM_AL_QUWAIN": "Umm Al Quwain",
  "leads.emirate.RAS_AL_KHAIMAH": "Ras Al Khaimah",
  "leads.emirate.FUJAIRAH": "Fujairah",
};
