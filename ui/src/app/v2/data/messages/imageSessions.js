// Central Arabic map for the IMAGE-SESSIONS message CODES
// (packages/shared/messages-codes/image-sessions/image-sessions.js → imageSessionsMessagesCodes).
// translationKey namespace: "imageSessionsMessages". Harvested from
// features/imageSessions/config/imageSessionsMessages.js. CODE → عربي.

export const imageSessionsMessages = {
  // ── ADMIN reference-data reads ──────────────────────────────────────────────────────
  IMAGE_SESSION_REFERENCE_FETCHED: "تم جلب البيانات",

  // ── ADMIN reference-data writes ─────────────────────────────────────────────────────
  IMAGE_SESSION_SPACE_CREATED: "تمت إضافة المساحة",
  IMAGE_SESSION_SPACE_UPDATED: "تم تحديث المساحة",
  IMAGE_SESSION_TEMPLATE_CREATED: "تمت إضافة القالب",
  IMAGE_SESSION_TEMPLATE_UPDATED: "تم تحديث القالب",
  IMAGE_SESSION_MATERIAL_CREATED: "تمت إضافة الخامة",
  IMAGE_SESSION_MATERIAL_UPDATED: "تم تحديث الخامة",
  IMAGE_SESSION_STYLE_CREATED: "تمت إضافة الطراز",
  IMAGE_SESSION_STYLE_UPDATED: "تم تحديث الطراز",
  IMAGE_SESSION_COLOR_CREATED: "تمت إضافة اللون",
  IMAGE_SESSION_COLOR_UPDATED: "تم تحديث اللون",
  IMAGE_SESSION_IMAGE_CREATED: "تمت إضافة الصورة",
  IMAGE_SESSION_IMAGE_UPDATED: "تم تحديث الصورة",
  IMAGE_SESSION_PAGE_INFO_CREATED: "تمت إضافة معلومات الصفحة",
  IMAGE_SESSION_PAGE_INFO_UPDATED: "تم تحديث معلومات الصفحة",
  IMAGE_SESSION_PRO_CON_CREATED: "تمت إضافة العنصر",
  IMAGE_SESSION_PRO_CON_UPDATED: "تم تحديث العنصر",
  IMAGE_SESSION_PRO_CON_DELETED: "تم حذف العنصر",
  IMAGE_SESSION_PRO_CON_REORDERED: "تم إعادة ترتيب العناصر",
  IMAGE_SESSION_PAGE_INFO_TYPE_EXISTS: "هذا النوع من معلومات الصفحة موجود بالفعل",

  // ── SHARED session-management (lead-scoped) ─────────────────────────────────────────
  IMAGE_SESSIONS_FETCHED: "تم جلب الجلسات",
  IMAGE_SESSION_CREATED: "تم إنشاء الجلسة",
  IMAGE_SESSION_UPDATED: "تم تحديث الجلسة",
  IMAGE_SESSION_TOKEN_REGENERATED: "تم إعادة إنشاء رابط الجلسة",
  IMAGE_SESSION_DELETED: "تم حذف الجلسة",
  IMAGE_SESSION_MODEL_IDS_FETCHED: "تم جلب القائمة",

  // ── PUBLIC client flow ──────────────────────────────────────────────────────────────
  IMAGE_SESSION_PAGE_INFO_FETCHED: "تم جلب معلومات الصفحة",
  IMAGE_SESSION_PROS_CONS_FETCHED: "تم جلب البيانات",
  IMAGE_SESSION_SESSION_FETCHED: "تم جلب الجلسة",
  IMAGE_SESSION_STATUS_UPDATED: "تم حفظ الاستجابة بنجاح",
  IMAGE_SESSION_COLORS_FETCHED: "تم جلب الألوان",
  IMAGE_SESSION_COLOR_SAVED: "تم حفظ اللون",
  IMAGE_SESSION_MATERIALS_FETCHED: "تم جلب الخامات",
  IMAGE_SESSION_MATERIAL_SAVED: "تم حفظ الخامات",
  IMAGE_SESSION_STYLES_FETCHED: "تم جلب الطرز",
  IMAGE_SESSION_STYLE_SAVED: "تم حفظ الطراز",
  IMAGE_SESSION_IMAGES_FETCHED: "تم جلب الصور",
  IMAGE_SESSION_IMAGES_SAVED: "تم حفظ الصور",
  IMAGE_SESSION_IMAGE_DELETED: "تم حذف الصورة",
  IMAGE_SESSION_PDF_GENERATED: "تم إنشاء الملف بنجاح",
  IMAGE_SESSION_MODEL_FETCHED: "تم جلب البيانات",
  IMAGE_SESSION_PATTERNS_SAVED: "تم حفظ الأنماط",
  IMAGE_SESSION_SELECTION_SAVED: "تم حفظ الاختيار",

  // ── errors / domain rules ───────────────────────────────────────────────────────────
  IMAGE_SESSION_NOT_FOUND: "الجلسة غير موجودة",
  IMAGE_SESSION_TOKEN_INVALID: "رابط الجلسة غير صالح",
  IMAGE_SESSION_MODEL_NOT_ALLOWED: "نوع البيانات غير مسموح",
  IMAGE_SESSION_PDF_GENERATION_FAILED: "فشل إنشاء الملف",
};
