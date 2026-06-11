// Central Arabic map for the CHAT message CODES
// (packages/shared/messages-codes/chat/chat.js → chatMessagesCodes).
// translationKey namespace: "chatMessages". NOTE: the existing feature resolver
// (features/chat/config/chatMessages.js) used a DIFFERENT, CHAT_*-prefixed key set that
// does NOT match the BE code strings (ROOM_CREATED, MEMBERS_ADDED, ...). This central map
// is keyed by the ACTUAL BE code strings the envelope carries; Arabic harvested by meaning
// from the feature resolver and completed for the codes it omitted. CODE → عربي.

export const chatMessages = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  ROOMS_FETCHED: "تم جلب المحادثات",
  ROOM_FETCHED: "تم جلب المحادثة",
  MESSAGES_FETCHED: "تم جلب الرسائل",
  MESSAGE_PAGE_FETCHED: "تم جلب الرسائل",
  PINNED_MESSAGES_FETCHED: "تم جلب الرسائل المثبتة",
  MEMBERS_FETCHED: "تم جلب الأعضاء",
  FILES_FETCHED: "تم جلب الملفات",
  FILE_STATS_FETCHED: "تم جلب إحصائيات الملفات",
  REACTION_ADDED: "تمت إضافة التفاعل",
  MEMBER_ROLE_UPDATED: "تم تحديث صلاحية العضو",

  // ── public client (token-based) surface ───────────────────────────────────────
  ROOM_TOKEN_VALIDATED: "تم التحقق من رابط المحادثة",
  INVALID_ROOM_TOKEN: "رابط المحادثة غير صالح",

  // ── success / mutations ──────────────────────────────────────────────────────
  ROOM_CREATED: "تم إنشاء المحادثة",
  LEAD_ROOM_CREATED: "تم إنشاء محادثة العميل",
  ROOM_UPDATED: "تم تحديث المحادثة",
  ROOM_DELETED: "تم حذف المحادثة",
  TOKEN_REGENERATED: "تم إعادة إنشاء رابط الوصول",
  CLIENT_ADDED: "تمت إضافة العميل إلى المحادثة",
  CLIENT_REMOVED: "تمت إزالة العميل من المحادثة",
  MESSAGES_MARKED_READ: "تم تعليم الرسائل كمقروءة",
  ALL_ROOMS_MARKED_READ: "تم تعليم جميع المحادثات كمقروءة",
  REACTION_REMOVED: "تمت إزالة التفاعل",
  MEMBERS_ADDED: "تمت إضافة الأعضاء",
  MEMBER_REMOVED: "تمت إزالة العضو",
  MESSAGE_DELETED: "تم حذف الرسالة",

  // ── errors / scope / guards ──────────────────────────────────────────────────
  ROOM_NOT_FOUND: "المحادثة غير موجودة",
  ROOM_ACCESS_DENIED: "لا تملك صلاحية الوصول إلى هذه المحادثة",
  ROOM_FORBIDDEN_ACTION: "لا تملك صلاحية تنفيذ هذا الإجراء في المحادثة",
  MESSAGE_NOT_FOUND: "الرسالة غير موجودة",
  MESSAGE_FORBIDDEN: "يمكنك تعديل/حذف رسائلك فقط",
  REACTION_NOT_FOUND: "التفاعل غير موجود",
  MEMBER_NOT_FOUND: "العضو غير موجود",
  CLIENT_LEAD_NOT_FOUND: "العميل غير موجود",
  NO_CLIENT_LEAD_ON_ROOM: "لا يوجد عميل مرتبط بهذه المحادثة",
  NO_PROJECTS_FOR_CRITERIA: "لا توجد مشاريع مطابقة",
  ROOM_NOT_DELETABLE: "لا يمكن حذف هذه المحادثة",
  CHAT_DISABLED: "المحادثة معطّلة",
  FILES_DISABLED: "مشاركة الملفات معطّلة",
  INVALID_MEMBER_ROLE: "صلاحية العضو غير صحيحة",
  INVALID_MANAGE_CLIENT_ACTION: "إجراء إدارة العميل غير صحيح",
};
