// Notification TYPE/level presentation map — single-language Arabic.
//
// The backend `Notification.type` is the Prisma `NotificationType` enum (server/prisma/
// schema.prisma). It is NOT one of the <StatusChip> domains (lead|contract|payment|task|
// session), and we must NOT edit the shared status tokens (providers/statusTokens.js) or
// labels to add a notification domain. So this feature-local map drives <StatusChip> by:
//   • supplying the Arabic `label` override (always rendered — never color-only, a11y 1.4.1),
//   • borrowing an EXISTING (domain, status) pair whose semantic bucket matches the intended
//     tone, so the chip gets an on-brand tinted color WITHOUT touching shared primitives.
//
// Semantic intent → a borrowed (domain, status) that resolves to that bucket in
// statusTokens.js: success → task/DONE · info → task/IN_PROGRESS · warning → payment/PENDING ·
// error → task/CANCELLED · neutral → task/TODO. Unknown/未-mapped types fall back to neutral.

const TONE = {
  success: { chipDomain: "task", chipStatus: "DONE" },
  info: { chipDomain: "task", chipStatus: "IN_PROGRESS" },
  warning: { chipDomain: "payment", chipStatus: "PENDING" },
  error: { chipDomain: "task", chipStatus: "CANCELLED" },
  neutral: { chipDomain: "task", chipStatus: "TODO" },
};

// type → { label (Arabic), tone }. Covers the NotificationType enum values that reach the
// authenticated user surface; anything else falls back to OTHER/neutral.
const TYPE_META = {
  // Leads lifecycle
  NEW_LEAD: { label: "عميل جديد", tone: "success" },
  LEAD_CREATED: { label: "تم إنشاء عميل", tone: "success" },
  LEAD_ASSIGNED: { label: "تم إسناد عميل", tone: "info" },
  LEAD_STATUS_CHANGE: { label: "تغيّرت حالة العميل", tone: "info" },
  LEAD_STATUS_CHANGED: { label: "تغيّرت حالة العميل", tone: "info" },
  LEAD_TRANSFERRED: { label: "تم تحويل عميل", tone: "warning" },
  LEAD_UPDATED: { label: "تحديث بيانات العميل", tone: "info" },
  LEAD_CONTACT: { label: "تواصل مع العميل", tone: "info" },
  LEAD_SUBMITTED: { label: "تم إرسال العميل", tone: "info" },

  // Notes & files
  NOTE_ADDED: { label: "ملاحظة جديدة", tone: "neutral" },
  NEW_NOTE: { label: "ملاحظة جديدة", tone: "neutral" },
  NEW_FILE: { label: "ملف جديد", tone: "neutral" },

  // Calls
  CALL_REMINDER_CREATED: { label: "تذكير باتصال", tone: "warning" },
  CALL_REMINDER_STATUS: { label: "حالة تذكير الاتصال", tone: "info" },

  // Pricing & payments
  PRICE_OFFER_SUBMITTED: { label: "عرض سعر مقدّم", tone: "info" },
  PRICE_OFFER_UPDATED: { label: "تحديث عرض السعر", tone: "info" },
  FINAL_PRICE_ADDED: { label: "سعر نهائي مضاف", tone: "warning" },
  FINAL_PRICE_CHANGED: { label: "تغيّر السعر النهائي", tone: "warning" },
  EXTRA_FINAL_PRICE_ADDED: { label: "سعر إضافي مضاف", tone: "warning" },
  EXTRA_FINAL_PRICE_EDITED: { label: "تعديل سعر إضافي", tone: "warning" },
  PAYMENT_ADDED: { label: "دفعة جديدة", tone: "success" },
  PAYMENT_STATUS_UPDATED: { label: "تحديث حالة الدفع", tone: "info" },

  // Work stages
  WORK_STAGE_UPDATED: { label: "تحديث مرحلة العمل", tone: "info" },

  // Courses / attempts
  TEST_FINISHED: { label: "انتهى الاختبار", tone: "info" },
  ATTEMPT_PASSED: { label: "اجتياز المحاولة", tone: "success" },
  ATTEMPT_FAILED: { label: "إخفاق المحاولة", tone: "error" },
  NEW_ATTEMPT_CREATED: { label: "محاولة جديدة", tone: "info" },
  NEW_ATTEMPT_ADDED: { label: "محاولة مضافة", tone: "info" },

  // Chat
  NEW_CHAT_MESSAGE: { label: "رسالة جديدة", tone: "info" },
  CHAT_MENTION: { label: "تمت الإشارة إليك", tone: "warning" },
  CHAT_ROOM_CREATED: { label: "غرفة محادثة جديدة", tone: "neutral" },
  CHAT_MEMBER_ADDED: { label: "عضو جديد في المحادثة", tone: "neutral" },
  CHAT_CALL_INCOMING: { label: "مكالمة واردة", tone: "info" },
  CHAT_CALL_MISSED: { label: "مكالمة فائتة", tone: "error" },

  OTHER: { label: "إشعار", tone: "neutral" },
};

const FALLBACK = { label: "إشعار", tone: "neutral" };

/**
 * Resolve a NotificationType enum value to its <StatusChip> props.
 * @param {string} type  the Prisma NotificationType value (or undefined).
 * @returns {{ label: string, domain: string, status: string }}
 */
export function resolveNotificationChip(type) {
  const meta = (type && TYPE_META[type]) || FALLBACK;
  const tone = TONE[meta.tone] ?? TONE.neutral;
  return { label: meta.label, domain: tone.chipDomain, status: tone.chipStatus };
}

export { TYPE_META as NOTIFICATION_TYPE_META };
