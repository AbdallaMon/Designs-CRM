// Central Arabic map for the LEADS message CODES
// (packages/shared/messages-codes/leads/leads.js → leadsMessagesCodes).
// translationKey namespace: "leadsMessages". Harvested from
// features/leads/config/leadsMessages.js and completed for the PUBLIC client funnel
// codes the feature resolver did not cover. CODE → عربي.

export const leadsMessages = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  LEADS_FETCHED: "تم جلب العملاء المحتملين",
  LEAD_FETCHED: "تم جلب بيانات العميل",
  DEALS_FETCHED: "تم جلب الصفقات",
  COLUMNS_FETCHED: "تم جلب الأعمدة",
  CALLS_FETCHED: "تم جلب المكالمات",
  MEETINGS_FETCHED: "تم جلب الاجتماعات",
  MEETING_REMINDERS_FETCHED: "تم جلب تذكيرات الاجتماعات",
  MEETING_REMINDER_FETCHED: "تم جلب تذكير الاجتماع",
  COUNTRY_CHECK_DONE: "تم التحقق من الدولة",

  // ── success / mutations ────────────────────────────────────────────────────────
  LEAD_UPDATED: "تم تحديث العميل",
  LEAD_ASSIGNED: "تم إسناد العميل إليك",
  LEAD_CONVERTED: "تم تحويل العميل",
  LEADS_BULK_CONVERTED: "تم تحويل العملاء المحددين",
  LEAD_MOVED_TO_CONVERTED: "تم نقل العميل إلى المحوّلين",
  LEAD_STATUS_CHANGED: "تم تغيير حالة العميل",
  LEAD_PRICE_UPDATED: "تم تحديث السعر",
  CALL_REMINDER_CREATED: "تم إنشاء تذكير المكالمة",
  CALL_REMINDER_UPDATED: "تم تحديث نتيجة المكالمة",
  MEETING_REMINDER_CREATED: "تم إنشاء تذكير الاجتماع",
  MEETING_REMINDER_UPDATED: "تم تحديث نتيجة الاجتماع",
  PRICE_OFFER_CREATED: "تم إنشاء عرض السعر",
  PRICE_OFFER_STATUS_CHANGED: "تم تحديث حالة عرض السعر",
  PAYMENTS_ADDED: "تمت إضافة الدفعات",
  FILE_SAVED: "تم حفظ الملف",
  NOTE_ADDED: "تمت إضافة الملاحظة",
  REMINDER_SENT: "تم إرسال التذكير",

  // ── errors / scope / guards ────────────────────────────────────────────────────
  LEAD_NOT_FOUND: "العميل غير موجود",
  LEAD_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذا العميل",
  LEAD_MUTATE_DENIED: "لا تملك صلاحية تعديل هذا العميل",
  CALL_REMINDER_NOT_FOUND: "تذكير المكالمة غير موجود",
  MEETING_REMINDER_NOT_FOUND: "تذكير الاجتماع غير موجود",
  PRICE_OFFER_NOT_FOUND: "عرض السعر غير موجود",
  LEAD_STATUS_TRANSITION_FORBIDDEN: "لا يمكن تغيير الحالة من الحالة الحالية",
  LEAD_ALREADY_ASSIGNED: "تم إسناد هذا العميل بالفعل",
  LEAD_COUNTRY_NOT_ALLOWED: "هذه الدولة غير مسموح بها لك",
  LEAD_MAX_ACTIVE_REACHED: "وصلت إلى الحد الأقصى من العملاء النشطين",
  LEAD_MAX_PER_DAY_REACHED: "وصلت إلى الحد الأقصى اليومي من العملاء",
  MEETING_NOT_ALLOWED_FOR_ROLE: "لا يمكن لهذا الدور إنشاء/تعديل الاجتماعات",
  REMINDER_TIME_IN_PAST: "وقت التذكير في الماضي",
  NO_AVAILABLE_SLOT: "لا يوجد موعد متاح",
  PRICE_OFFER_RANGE_INVALID: "نطاق السعر غير صحيح",
  NOTE_CONTENT_EMPTY: "محتوى الملاحظة فارغ",
  FILE_FIELDS_REQUIRED: "حقول الملف مطلوبة",
  BULK_CONVERT_FORBIDDEN: "لا تملك صلاحية التحويل الجماعي",
  LEAD_CONVERT_REQUIRES_OWNER: "لا يمكن التحويل إلى صفقة قبل إسناد العميل لموظف",

  // ── PUBLIC client lead funnel (website new-lead / register / cooperation) ───────
  CLIENT_LEAD_CREATED: "تم إرسال طلبك بنجاح",
  CLIENT_LEAD_REGISTERED: "تم التسجيل بنجاح",
  CLIENT_LEAD_REGISTER_COMPLETED: "تم إكمال التسجيل بنجاح",
  CLIENT_LEAD_ALREADY_TODAY: "لقد أرسلت طلباً بالفعل اليوم، حاول غداً",
  CLIENT_LEAD_ALREADY_COMPLETED: "تم إكمال هذا التسجيل بالفعل",
  COOPERATION_REQUEST_SENT: "تم إرسال طلب التعاون بنجاح",
};
