// Per-feature UI dictionary: lead detail HUB (header, rail, group/sub tabs, tab bodies, dialogs).
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "leadsDetails.*". The barrel (./index.js) deep-merges every stub's `ar` into
// one ar map and `en` into one en map, then uiDictionary merges those on top of its core keys. You
// do NOT edit the barrel or uiDictionary — just fill this file and call t("leadsDetails.<key>").
//
// CONTRACT: ar is the existing/authoritative wording (verbatim from the components it replaces),
// so ar renders identically. en is the additive natural translation. Keys identical across ar/en.

export const ar = {
  // ── page: access denied / states ────────────────────────────────────────────
  "leadsDetails.denied.title": "لا تملك صلاحية الوصول إلى هذا العميل",
  "leadsDetails.denied.message":
    "لا تملك صلاحية الوصول إلى بيانات هذا العميل المحتمل. إن كنت تظن أنه ينبغي أن تصل إليها، تواصل مع المسؤول.",

  // ── hub group tabs ──────────────────────────────────────────────────────────
  "leadsDetails.group.overview": "نظرة عامة",
  "leadsDetails.group.record": "السجل",
  "leadsDetails.group.production": "الأعمال",
  "leadsDetails.group.finance": "المالية",
  "leadsDetails.group.sales": "أدوات المبيعات",

  // ── hub sub tabs ────────────────────────────────────────────────────────────
  "leadsDetails.sub.overview": "التفاصيل",
  "leadsDetails.sub.calls": "المكالمات",
  "leadsDetails.sub.meetings": "الاجتماعات",
  "leadsDetails.sub.notes": "الملاحظات",
  "leadsDetails.sub.files": "المرفقات",
  "leadsDetails.sub.chats": "المحادثات",
  "leadsDetails.sub.projects": "المشاريع",
  "leadsDetails.sub.sessions": "جلسات الصور",
  "leadsDetails.sub.updates": "التحديثات",
  "leadsDetails.sub.contracts": "العقود",
  "leadsDetails.sub.payments": "الدفعات",
  "leadsDetails.sub.priceOffers": "عروض الأسعار",
  "leadsDetails.sub.salesStage": "مرحلة البيع",
  "leadsDetails.sub.spin": "أسئلة SPIN",
  "leadsDetails.sub.versa": "معالجة الاعتراضات",

  // ── orientation band ────────────────────────────────────────────────────────
  "leadsDetails.orientation.breadcrumbAria": "مسار التنقل",
  "leadsDetails.orientation.leadsRoot": "العملاء المحتملون",
  "leadsDetails.orientation.viewOnly": "وضع العرض فقط",
  "leadsDetails.orientation.advanceStage": "متابعة مرحلة البيع",
  "leadsDetails.orientation.addPayment": "إضافة دفعة",
  "leadsDetails.orientation.openProject": "فتح المشروع",
  "leadsDetails.orientation.logCall": "تسجيل مكالمة",
  "leadsDetails.orientation.addNote": "إضافة ملاحظة",

  // ── hub header ──────────────────────────────────────────────────────────────
  "leadsDetails.header.quick.logCall": "تسجيل مكالمة",
  "leadsDetails.header.quick.note": "ملاحظة",
  "leadsDetails.header.quick.payment": "دفعة",
  "leadsDetails.header.assignedTo": "مُسند إلى",

  // ── related rail ────────────────────────────────────────────────────────────
  "leadsDetails.rail.navAria": "السجلات المرتبطة",
  "leadsDetails.rail.projects": "المشاريع",
  "leadsDetails.rail.contracts": "العقود",
  "leadsDetails.rail.sessions": "جلسات الصور",
  "leadsDetails.rail.payments": "الدفعات",
  "leadsDetails.rail.calls": "المكالمات",
  "leadsDetails.rail.meetings": "الاجتماعات",
  "leadsDetails.rail.denied.tooltip": "لا تملك صلاحية العرض",
  "leadsDetails.rail.denied.label": "محظور",
  "leadsDetails.rail.unavailable": "غير متاح",

  // ── status menu ─────────────────────────────────────────────────────────────
  "leadsDetails.statusMenu.button": "تغيير الحالة",
  "leadsDetails.statusMenu.loading": "جاري تغيير الحالة...",

  // ── record list primitive ───────────────────────────────────────────────────
  "leadsDetails.recordList.empty": "لا توجد بيانات",
  "leadsDetails.recordList.showLess": "عرض أقل",
  "leadsDetails.recordList.showAll": "عرض الكل ({count})",

  // ── chat launcher ───────────────────────────────────────────────────────────
  "leadsDetails.chat.denied": "لا تملك صلاحية الوصول إلى المحادثات",
  "leadsDetails.chat.title": "المحادثات",
  "leadsDetails.chat.open": "فتح المحادثات",
  "leadsDetails.chat.loading": "جاري التحميل...",
  "leadsDetails.chat.empty.title": "لا توجد محادثات مرتبطة بهذا العميل بعد",
  "leadsDetails.chat.empty.description": "افتح شاشة المحادثات لإنشاء محادثة جديدة.",
  "leadsDetails.chat.roomSecondary": "محادثة العميل · {name}",
  "leadsDetails.chat.roomSecondaryFallback": "محادثة العميل",

  // ── reminder buttons ────────────────────────────────────────────────────────
  "leadsDetails.reminder.payment": "تذكير بالدفع",
  "leadsDetails.reminder.complete": "تذكير بإكمال التسجيل",
  "leadsDetails.reminder.loading": "جاري الإرسال...",

  // ── overview tab ────────────────────────────────────────────────────────────
  "leadsDetails.overview.contact": "معلومات الاتصال",
  "leadsDetails.overview.request": "تفاصيل الطلب",
  "leadsDetails.overview.phone": "الهاتف",
  "leadsDetails.overview.email": "البريد",
  "leadsDetails.overview.location": "الموقع",
  "leadsDetails.overview.emirate": "الإمارة",
  "leadsDetails.overview.category": "التصنيف",
  "leadsDetails.overview.assignedTo": "مُسند إلى",
  "leadsDetails.overview.description": "الوصف",

  // ── calls tab ───────────────────────────────────────────────────────────────
  "leadsDetails.calls.title": "المكالمات",
  "leadsDetails.calls.empty.title": "لا توجد مكالمات مجدولة",
  "leadsDetails.calls.empty.canAdd": "جدول مكالمة لمتابعة هذا العميل المحتمل.",
  "leadsDetails.calls.empty.readonly": "لم تتم جدولة أي مكالمة لهذا العميل بعد.",

  // ── meetings tab ────────────────────────────────────────────────────────────
  "leadsDetails.meetings.title": "الاجتماعات",
  "leadsDetails.meetings.empty.title": "لا توجد اجتماعات",
  "leadsDetails.meetings.empty.canAdd": "جدول اجتماعاً مع هذا العميل المحتمل.",
  "leadsDetails.meetings.empty.readonly": "لم تتم جدولة أي اجتماع لهذا العميل بعد.",

  // ── notes tab ───────────────────────────────────────────────────────────────
  "leadsDetails.notes.title": "الملاحظات",
  "leadsDetails.notes.empty.title": "لا توجد ملاحظات بعد",
  "leadsDetails.notes.empty.canAdd": "أضف ملاحظة لتوثيق تفاصيل التواصل مع هذا العميل.",
  "leadsDetails.notes.empty.readonly": "لم تُضف أي ملاحظة لهذا العميل بعد.",

  // ── files tab ───────────────────────────────────────────────────────────────
  "leadsDetails.files.system.title": "ملفات النظام ({count})",
  "leadsDetails.files.system.empty.title": "لا توجد ملفات نظام",
  "leadsDetails.files.system.empty.canAdd": "أرفق ملفاً (صورة، PDF، مستند) متعلقاً بهذا العميل.",
  "leadsDetails.files.system.empty.readonly": "لم يُرفق أي ملف من قبل الفريق بعد.",
  "leadsDetails.files.client.title": "ملفات العميل ({count})",
  "leadsDetails.files.client.empty.title": "لا توجد ملفات من العميل",
  "leadsDetails.files.client.empty.description": "لم يرفع العميل أي ملف بعد.",

  // ── price offers tab ────────────────────────────────────────────────────────
  "leadsDetails.priceOffers.title": "عروض الأسعار",
  "leadsDetails.priceOffers.verdict.accepted": "مقبول",
  "leadsDetails.priceOffers.verdict.rejected": "مرفوض",
  "leadsDetails.priceOffers.verdict.review": "قيد المراجعة",
  "leadsDetails.priceOffers.empty.title": "لا توجد عروض أسعار",
  "leadsDetails.priceOffers.empty.canAdd": "أنشئ عرض سعر لمشاركته مع هذا العميل.",
  "leadsDetails.priceOffers.empty.readonly": "لم يُنشأ أي عرض سعر لهذا العميل بعد.",

  // ── payments tab ────────────────────────────────────────────────────────────
  "leadsDetails.payments.title": "الدفعات",
  "leadsDetails.payments.summary": "المدفوع: {paid} · المتبقي: {remaining}",
  "leadsDetails.payments.empty.title": "لا توجد دفعات مسجلة",
  "leadsDetails.payments.empty.canAdd": "سجّل دفعة لمتابعة المبالغ المستحقة والمدفوعة لهذا العميل.",
  "leadsDetails.payments.empty.readonly": "لم تُسجّل أي دفعة لهذا العميل بعد.",

  // ── call / meeting dialogs ──────────────────────────────────────────────────
  "leadsDetails.callMeeting.label.call": "مكالمة",
  "leadsDetails.callMeeting.label.meeting": "اجتماع",
  "leadsDetails.callMeeting.schedule": "جدولة {name} جديد",
  "leadsDetails.callMeeting.timeLabel": "وقت ال{name}",
  "leadsDetails.callMeeting.reasonLabel": "سبب التذكير",
  "leadsDetails.callMeeting.cancel": "إلغاء",
  "leadsDetails.callMeeting.confirm": "جدولة",
  "leadsDetails.callMeeting.create.loading": "جاري الإنشاء...",
  "leadsDetails.callMeeting.result.button": "تحديث نتيجة ال{name}",
  "leadsDetails.callMeeting.result.title": "تحديث نتيجة ال{name}",
  "leadsDetails.callMeeting.result.done": "تم",
  "leadsDetails.callMeeting.result.missed": "فائت",
  "leadsDetails.callMeeting.result.label": "النتيجة",
  "leadsDetails.callMeeting.result.confirm": "تحديث",
  "leadsDetails.callMeeting.result.loading": "جاري التحديث...",

  // ── note dialog ─────────────────────────────────────────────────────────────
  "leadsDetails.note.add": "إضافة ملاحظة",
  "leadsDetails.note.title": "إضافة ملاحظة",
  "leadsDetails.note.label": "اكتب ملاحظتك",
  "leadsDetails.note.placeholder": "اكتب الملاحظة هنا...",
  "leadsDetails.note.cancel": "إلغاء",
  "leadsDetails.note.confirm": "إضافة",
  "leadsDetails.note.loading": "جاري الإنشاء...",

  // ── payment dialog ──────────────────────────────────────────────────────────
  "leadsDetails.payment.level1": "الدفعة الأولى",
  "leadsDetails.payment.level2": "الدفعة الثانية",
  "leadsDetails.payment.level3": "الدفعة الثالثة",
  "leadsDetails.payment.level4": "الدفعة الرابعة",
  "leadsDetails.payment.level5": "الدفعة الخامسة",
  "leadsDetails.payment.add": "إضافة دفعة",
  "leadsDetails.payment.title": "إضافة دفعة",
  "leadsDetails.payment.amount": "المبلغ",
  "leadsDetails.payment.levelLabel": "مستوى الدفعة",
  "leadsDetails.payment.note": "ملاحظة",
  "leadsDetails.payment.cancel": "إلغاء",
  "leadsDetails.payment.confirm": "إضافة",
  "leadsDetails.payment.loading": "جاري الإضافة...",

  // ── price offer dialog ──────────────────────────────────────────────────────
  "leadsDetails.priceOffer.add": "إضافة عرض سعر",
  "leadsDetails.priceOffer.title": "عرض سعر جديد",
  "leadsDetails.priceOffer.url": "رابط العرض",
  "leadsDetails.priceOffer.minPrice": "أقل سعر",
  "leadsDetails.priceOffer.maxPrice": "أعلى سعر",
  "leadsDetails.priceOffer.note": "ملاحظة",
  "leadsDetails.priceOffer.cancel": "إلغاء",
  "leadsDetails.priceOffer.save": "حفظ",
  "leadsDetails.priceOffer.create.loading": "جاري الإنشاء...",
  "leadsDetails.priceOffer.accept": "قبول",
  "leadsDetails.priceOffer.reject": "رفض",
  "leadsDetails.priceOffer.change.loading": "جاري التحديث...",

  // ── add-file dialog ─────────────────────────────────────────────────────────
  "leadsDetails.file.add": "إضافة ملف",
  "leadsDetails.file.title": "ملف جديد",
  "leadsDetails.file.nameLabel": "اسم الملف",
  "leadsDetails.file.descriptionLabel": "الوصف",
  "leadsDetails.file.pick": "اختر ملفاً",
  "leadsDetails.file.cancel": "إلغاء",
  "leadsDetails.file.save": "حفظ",
  "leadsDetails.file.loading": "جاري الحفظ...",
};

export const en = {
  // ── page: access denied / states ────────────────────────────────────────────
  "leadsDetails.denied.title": "You don't have permission to access this lead",
  "leadsDetails.denied.message":
    "You don't have permission to access this lead's data. If you think you should, contact the administrator.",

  // ── hub group tabs ──────────────────────────────────────────────────────────
  "leadsDetails.group.overview": "Overview",
  "leadsDetails.group.record": "Record",
  "leadsDetails.group.production": "Work",
  "leadsDetails.group.finance": "Finance",
  "leadsDetails.group.sales": "Sales tools",

  // ── hub sub tabs ────────────────────────────────────────────────────────────
  "leadsDetails.sub.overview": "Details",
  "leadsDetails.sub.calls": "Calls",
  "leadsDetails.sub.meetings": "Meetings",
  "leadsDetails.sub.notes": "Notes",
  "leadsDetails.sub.files": "Attachments",
  "leadsDetails.sub.chats": "Chats",
  "leadsDetails.sub.projects": "Projects",
  "leadsDetails.sub.sessions": "Image sessions",
  "leadsDetails.sub.updates": "Updates",
  "leadsDetails.sub.contracts": "Contracts",
  "leadsDetails.sub.payments": "Payments",
  "leadsDetails.sub.priceOffers": "Price offers",
  "leadsDetails.sub.salesStage": "Sales stage",
  "leadsDetails.sub.spin": "SPIN questions",
  "leadsDetails.sub.versa": "Objection handling",

  // ── orientation band ────────────────────────────────────────────────────────
  "leadsDetails.orientation.breadcrumbAria": "Breadcrumb",
  "leadsDetails.orientation.leadsRoot": "Leads",
  "leadsDetails.orientation.viewOnly": "View only",
  "leadsDetails.orientation.advanceStage": "Advance sales stage",
  "leadsDetails.orientation.addPayment": "Add payment",
  "leadsDetails.orientation.openProject": "Open project",
  "leadsDetails.orientation.logCall": "Log a call",
  "leadsDetails.orientation.addNote": "Add a note",

  // ── hub header ──────────────────────────────────────────────────────────────
  "leadsDetails.header.quick.logCall": "Log a call",
  "leadsDetails.header.quick.note": "Note",
  "leadsDetails.header.quick.payment": "Payment",
  "leadsDetails.header.assignedTo": "Assigned to",

  // ── related rail ────────────────────────────────────────────────────────────
  "leadsDetails.rail.navAria": "Related records",
  "leadsDetails.rail.projects": "Projects",
  "leadsDetails.rail.contracts": "Contracts",
  "leadsDetails.rail.sessions": "Image sessions",
  "leadsDetails.rail.payments": "Payments",
  "leadsDetails.rail.calls": "Calls",
  "leadsDetails.rail.meetings": "Meetings",
  "leadsDetails.rail.denied.tooltip": "You don't have permission to view",
  "leadsDetails.rail.denied.label": "Restricted",
  "leadsDetails.rail.unavailable": "Unavailable",

  // ── status menu ─────────────────────────────────────────────────────────────
  "leadsDetails.statusMenu.button": "Change status",
  "leadsDetails.statusMenu.loading": "Changing status...",

  // ── record list primitive ───────────────────────────────────────────────────
  "leadsDetails.recordList.empty": "No data",
  "leadsDetails.recordList.showLess": "Show less",
  "leadsDetails.recordList.showAll": "Show all ({count})",

  // ── chat launcher ───────────────────────────────────────────────────────────
  "leadsDetails.chat.denied": "You don't have permission to access chats",
  "leadsDetails.chat.title": "Chats",
  "leadsDetails.chat.open": "Open chats",
  "leadsDetails.chat.loading": "Loading...",
  "leadsDetails.chat.empty.title": "No chats linked to this lead yet",
  "leadsDetails.chat.empty.description": "Open the chats screen to start a new chat.",
  "leadsDetails.chat.roomSecondary": "Lead chat · {name}",
  "leadsDetails.chat.roomSecondaryFallback": "Lead chat",

  // ── reminder buttons ────────────────────────────────────────────────────────
  "leadsDetails.reminder.payment": "Payment reminder",
  "leadsDetails.reminder.complete": "Complete-registration reminder",
  "leadsDetails.reminder.loading": "Sending...",

  // ── overview tab ────────────────────────────────────────────────────────────
  "leadsDetails.overview.contact": "Contact information",
  "leadsDetails.overview.request": "Request details",
  "leadsDetails.overview.phone": "Phone",
  "leadsDetails.overview.email": "Email",
  "leadsDetails.overview.location": "Location",
  "leadsDetails.overview.emirate": "Emirate",
  "leadsDetails.overview.category": "Category",
  "leadsDetails.overview.assignedTo": "Assigned to",
  "leadsDetails.overview.description": "Description",

  // ── calls tab ───────────────────────────────────────────────────────────────
  "leadsDetails.calls.title": "Calls",
  "leadsDetails.calls.empty.title": "No scheduled calls",
  "leadsDetails.calls.empty.canAdd": "Schedule a call to follow up with this lead.",
  "leadsDetails.calls.empty.readonly": "No call has been scheduled for this lead yet.",

  // ── meetings tab ────────────────────────────────────────────────────────────
  "leadsDetails.meetings.title": "Meetings",
  "leadsDetails.meetings.empty.title": "No meetings",
  "leadsDetails.meetings.empty.canAdd": "Schedule a meeting with this lead.",
  "leadsDetails.meetings.empty.readonly": "No meeting has been scheduled for this lead yet.",

  // ── notes tab ───────────────────────────────────────────────────────────────
  "leadsDetails.notes.title": "Notes",
  "leadsDetails.notes.empty.title": "No notes yet",
  "leadsDetails.notes.empty.canAdd": "Add a note to document the communication details with this lead.",
  "leadsDetails.notes.empty.readonly": "No note has been added for this lead yet.",

  // ── files tab ───────────────────────────────────────────────────────────────
  "leadsDetails.files.system.title": "System files ({count})",
  "leadsDetails.files.system.empty.title": "No system files",
  "leadsDetails.files.system.empty.canAdd": "Attach a file (image, PDF, document) related to this lead.",
  "leadsDetails.files.system.empty.readonly": "No file has been attached by the team yet.",
  "leadsDetails.files.client.title": "Client files ({count})",
  "leadsDetails.files.client.empty.title": "No files from the client",
  "leadsDetails.files.client.empty.description": "The client hasn't uploaded any file yet.",

  // ── price offers tab ────────────────────────────────────────────────────────
  "leadsDetails.priceOffers.title": "Price offers",
  "leadsDetails.priceOffers.verdict.accepted": "Accepted",
  "leadsDetails.priceOffers.verdict.rejected": "Rejected",
  "leadsDetails.priceOffers.verdict.review": "Under review",
  "leadsDetails.priceOffers.empty.title": "No price offers",
  "leadsDetails.priceOffers.empty.canAdd": "Create a price offer to share with this lead.",
  "leadsDetails.priceOffers.empty.readonly": "No price offer has been created for this lead yet.",

  // ── payments tab ────────────────────────────────────────────────────────────
  "leadsDetails.payments.title": "Payments",
  "leadsDetails.payments.summary": "Paid: {paid} · Remaining: {remaining}",
  "leadsDetails.payments.empty.title": "No recorded payments",
  "leadsDetails.payments.empty.canAdd": "Record a payment to track the amounts due and paid for this lead.",
  "leadsDetails.payments.empty.readonly": "No payment has been recorded for this lead yet.",

  // ── call / meeting dialogs ──────────────────────────────────────────────────
  "leadsDetails.callMeeting.label.call": "call",
  "leadsDetails.callMeeting.label.meeting": "meeting",
  "leadsDetails.callMeeting.schedule": "Schedule a new {name}",
  "leadsDetails.callMeeting.timeLabel": "{name} time",
  "leadsDetails.callMeeting.reasonLabel": "Reminder reason",
  "leadsDetails.callMeeting.cancel": "Cancel",
  "leadsDetails.callMeeting.confirm": "Schedule",
  "leadsDetails.callMeeting.create.loading": "Creating...",
  "leadsDetails.callMeeting.result.button": "Update {name} result",
  "leadsDetails.callMeeting.result.title": "Update {name} result",
  "leadsDetails.callMeeting.result.done": "Done",
  "leadsDetails.callMeeting.result.missed": "Missed",
  "leadsDetails.callMeeting.result.label": "Result",
  "leadsDetails.callMeeting.result.confirm": "Update",
  "leadsDetails.callMeeting.result.loading": "Updating...",

  // ── note dialog ─────────────────────────────────────────────────────────────
  "leadsDetails.note.add": "Add a note",
  "leadsDetails.note.title": "Add a note",
  "leadsDetails.note.label": "Write your note",
  "leadsDetails.note.placeholder": "Write the note here...",
  "leadsDetails.note.cancel": "Cancel",
  "leadsDetails.note.confirm": "Add",
  "leadsDetails.note.loading": "Creating...",

  // ── payment dialog ──────────────────────────────────────────────────────────
  "leadsDetails.payment.level1": "First payment",
  "leadsDetails.payment.level2": "Second payment",
  "leadsDetails.payment.level3": "Third payment",
  "leadsDetails.payment.level4": "Fourth payment",
  "leadsDetails.payment.level5": "Fifth payment",
  "leadsDetails.payment.add": "Add payment",
  "leadsDetails.payment.title": "Add payment",
  "leadsDetails.payment.amount": "Amount",
  "leadsDetails.payment.levelLabel": "Payment level",
  "leadsDetails.payment.note": "Note",
  "leadsDetails.payment.cancel": "Cancel",
  "leadsDetails.payment.confirm": "Add",
  "leadsDetails.payment.loading": "Adding...",

  // ── price offer dialog ──────────────────────────────────────────────────────
  "leadsDetails.priceOffer.add": "Add price offer",
  "leadsDetails.priceOffer.title": "New price offer",
  "leadsDetails.priceOffer.url": "Offer link",
  "leadsDetails.priceOffer.minPrice": "Min price",
  "leadsDetails.priceOffer.maxPrice": "Max price",
  "leadsDetails.priceOffer.note": "Note",
  "leadsDetails.priceOffer.cancel": "Cancel",
  "leadsDetails.priceOffer.save": "Save",
  "leadsDetails.priceOffer.create.loading": "Creating...",
  "leadsDetails.priceOffer.accept": "Accept",
  "leadsDetails.priceOffer.reject": "Reject",
  "leadsDetails.priceOffer.change.loading": "Updating...",

  // ── add-file dialog ─────────────────────────────────────────────────────────
  "leadsDetails.file.add": "Add file",
  "leadsDetails.file.title": "New file",
  "leadsDetails.file.nameLabel": "File name",
  "leadsDetails.file.descriptionLabel": "Description",
  "leadsDetails.file.pick": "Choose a file",
  "leadsDetails.file.cancel": "Cancel",
  "leadsDetails.file.save": "Save",
  "leadsDetails.file.loading": "Saving...",
};
