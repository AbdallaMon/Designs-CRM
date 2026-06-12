// Config-driven NotificationType descriptors — the contract for how each notification type
// renders (Arabic label + a "tone" that drives the colored dot/icon). Lives in config/, not
// inline in the page (mirrors features/leads/config/*). Keys byte-match the backend Prisma
// enum NotificationType (packages/db/prisma/schema.prisma). Single language (Arabic).
//
// `tone` is a semantic bucket the page maps to an MUI palette color + a react-icons glyph,
// so the page never hardcodes a color per literal type. Unknown/missing types fall back to
// the "default" descriptor.

import {
  MdPersonAddAlt1,
  MdAssignmentInd,
  MdSwapHoriz,
  MdEdit,
  MdNoteAdd,
  MdAttachFile,
  MdAlarm,
  MdPriceChange,
  MdPayments,
  MdConstruction,
  MdQuiz,
  MdChatBubble,
  MdAlternateEmail,
  MdGroupAdd,
  MdCall,
  MdNotificationsActive,
} from "react-icons/md";

// tone → { color: MUI palette key, icon }. `color` is read as palette[color].main by the page.
export const NOTIFICATION_TONES = {
  info: { color: "info", icon: MdNotificationsActive },
  success: { color: "success", icon: MdPayments },
  warning: { color: "warning", icon: MdAlarm },
  error: { color: "error", icon: MdCall },
  primary: { color: "primary", icon: MdEdit },
  default: { color: "info", icon: MdNotificationsActive },
};

// type → { label (Arabic), tone, icon (overrides the tone's default glyph) }.
export const NOTIFICATION_TYPES = {
  // ── leads / sales ──────────────────────────────────────────────────────────────────
  NEW_LEAD: { label: "عميل محتمل جديد", tone: "info", icon: MdPersonAddAlt1 },
  LEAD_CREATED: { label: "تم إنشاء عميل محتمل", tone: "info", icon: MdPersonAddAlt1 },
  LEAD_SUBMITTED: { label: "تم تقديم عميل محتمل", tone: "info", icon: MdPersonAddAlt1 },
  LEAD_ASSIGNED: { label: "تم إسناد عميل محتمل", tone: "primary", icon: MdAssignmentInd },
  LEAD_STATUS_CHANGE: { label: "تغيّرت حالة العميل", tone: "primary", icon: MdSwapHoriz },
  LEAD_STATUS_CHANGED: { label: "تغيّرت حالة العميل", tone: "primary", icon: MdSwapHoriz },
  LEAD_TRANSFERRED: { label: "تم تحويل العميل", tone: "primary", icon: MdSwapHoriz },
  LEAD_UPDATED: { label: "تم تحديث العميل", tone: "primary", icon: MdEdit },
  LEAD_CONTACT: { label: "تواصل مع العميل", tone: "info", icon: MdCall },

  // ── notes / files ──────────────────────────────────────────────────────────────────
  NOTE_ADDED: { label: "تمت إضافة ملاحظة", tone: "info", icon: MdNoteAdd },
  NEW_NOTE: { label: "ملاحظة جديدة", tone: "info", icon: MdNoteAdd },
  NEW_FILE: { label: "ملف جديد", tone: "info", icon: MdAttachFile },

  // ── reminders ──────────────────────────────────────────────────────────────────────
  CALL_REMINDER_CREATED: { label: "تذكير اتصال جديد", tone: "warning", icon: MdAlarm },
  CALL_REMINDER_STATUS: { label: "حالة تذكير الاتصال", tone: "warning", icon: MdAlarm },

  // ── pricing / payments ─────────────────────────────────────────────────────────────
  PRICE_OFFER_SUBMITTED: { label: "تم تقديم عرض سعر", tone: "info", icon: MdPriceChange },
  PRICE_OFFER_UPDATED: { label: "تم تحديث عرض السعر", tone: "info", icon: MdPriceChange },
  FINAL_PRICE_ADDED: { label: "تمت إضافة السعر النهائي", tone: "success", icon: MdPriceChange },
  FINAL_PRICE_CHANGED: { label: "تغيّر السعر النهائي", tone: "primary", icon: MdPriceChange },
  EXTRA_FINAL_PRICE_ADDED: { label: "سعر نهائي إضافي", tone: "success", icon: MdPriceChange },
  EXTRA_FINAL_PRICE_EDITED: { label: "تعديل سعر نهائي إضافي", tone: "primary", icon: MdPriceChange },
  PAYMENT_ADDED: { label: "تمت إضافة دفعة", tone: "success", icon: MdPayments },
  PAYMENT_STATUS_UPDATED: { label: "تحديث حالة الدفع", tone: "primary", icon: MdPayments },

  // ── work / projects ────────────────────────────────────────────────────────────────
  WORK_STAGE_UPDATED: { label: "تحديث مرحلة العمل", tone: "primary", icon: MdConstruction },

  // ── courses / LMS ──────────────────────────────────────────────────────────────────
  TEST_FINISHED: { label: "انتهى الاختبار", tone: "info", icon: MdQuiz },
  ATTEMPT_PASSED: { label: "تم اجتياز المحاولة", tone: "success", icon: MdQuiz },
  ATTEMPT_FAILED: { label: "لم تُجتَز المحاولة", tone: "error", icon: MdQuiz },
  NEW_ATTEMPT_CREATED: { label: "محاولة جديدة", tone: "info", icon: MdQuiz },
  NEW_ATTEMPT_ADDED: { label: "تمت إضافة محاولة", tone: "info", icon: MdQuiz },

  // ── chat ───────────────────────────────────────────────────────────────────────────
  NEW_CHAT_MESSAGE: { label: "رسالة محادثة جديدة", tone: "info", icon: MdChatBubble },
  CHAT_MENTION: { label: "تمت الإشارة إليك", tone: "warning", icon: MdAlternateEmail },
  CHAT_ROOM_CREATED: { label: "تم إنشاء غرفة محادثة", tone: "info", icon: MdChatBubble },
  CHAT_MEMBER_ADDED: { label: "تمت إضافة عضو", tone: "info", icon: MdGroupAdd },
  CHAT_CALL_INCOMING: { label: "مكالمة واردة", tone: "success", icon: MdCall },
  CHAT_CALL_MISSED: { label: "مكالمة فائتة", tone: "error", icon: MdCall },

  // ── catch-all ──────────────────────────────────────────────────────────────────────
  OTHER: { label: "إشعار", tone: "default", icon: MdNotificationsActive },
};

const DEFAULT_DESCRIPTOR = { label: "إشعار", tone: "default", icon: MdNotificationsActive };

/**
 * Resolve a backend NotificationType to its display descriptor. Unknown/missing types fall
 * back to a generic "إشعار" descriptor so the row always renders.
 * @param {string} type
 * @returns {{ label: string, tone: string, icon: Function }}
 */
export function resolveNotificationType(type) {
  const d = (type && NOTIFICATION_TYPES[type]) || DEFAULT_DESCRIPTOR;
  return { ...DEFAULT_DESCRIPTOR, ...d };
}

/**
 * Resolve the MUI palette color KEY for a notification type's tone (e.g. "success").
 * @param {string} type
 */
export function notificationToneColor(type) {
  const { tone } = resolveNotificationType(type);
  return (NOTIFICATION_TONES[tone] || NOTIFICATION_TONES.default).color;
}
