// Single-language (Arabic) resolution for backend message CODES emitted by the chat
// API ({ success, message: CODE, translationKey }). The backend stays language-neutral;
// this is the FE lookup (migration plan §4/§5 — message-code indirection kept,
// second language dropped). Unknown codes fall back to a generic Arabic string.

export const chatMessages = {
  // rooms
  CHAT_ROOM_CREATED: "تم إنشاء المحادثة",
  CHAT_ROOM_UPDATED: "تم تحديث المحادثة",
  CHAT_ROOM_DELETED: "تم حذف المحادثة",
  CHAT_ROOM_NOT_FOUND: "المحادثة غير موجودة",
  CHAT_ROOM_SETTINGS_UPDATED: "تم تحديث إعدادات المحادثة",
  CHAT_TOKEN_REGENERATED: "تم إعادة إنشاء رابط الوصول",
  CHAT_CLIENT_UPDATED: "تم تحديث العميل في المحادثة",
  // members
  CHAT_MEMBERS_ADDED: "تمت إضافة الأعضاء",
  CHAT_MEMBER_REMOVED: "تمت إزالة العضو",
  CHAT_MEMBER_UPDATED: "تم تحديث العضو",
  // messages
  CHAT_MESSAGES_READ: "تم تعليم الرسائل كمقروءة",
  CHAT_REACTION_ADDED: "تمت إضافة التفاعل",
  CHAT_REACTION_REMOVED: "تمت إزالة التفاعل",
  // generic
  OK: "تمت العملية بنجاح",
  FORBIDDEN: "لا تملك صلاحية تنفيذ هذا الإجراء",
  ACCESS_DENIED: "لا تملك صلاحية الوصول",
  VALIDATION_ERROR: "بيانات غير صحيحة",
};

import { resolveMessageCode } from "@/app/v2/data/resolveMessageCode.js";

/**
 * Resolve a backend message CODE to an Arabic display string. Feature Arabic wins first;
 * unknown codes delegate to the CENTRAL resolver. `translationKey` routes the central lookup.
 * @param {string} code
 * @param {{ fallback?: string, translationKey?: string }} [opts]
 */
export function resolveChatMessage(code, { fallback, translationKey } = {}) {
  if (code && chatMessages[code]) return chatMessages[code];
  return resolveMessageCode(code, { translationKey, fallback });
}
