// Per-feature UI dictionary: notifications list page chrome + tabs + columns + empty states.
// Namespaced under "notifications.*".
//
// CONTRACT: ar is the existing/authoritative wording (verbatim); en is the additive translation.
// Excluded: backend message CODES (config/notificationsMessages.js), the NotificationType enum
// VALUE → label map (config/notificationTypes.js), the relative-time grammar formatter
// (config/formatTime.js), and the toast-runner defaults (notifications.mutations.js).
// The notification ROW content itself is server-rendered HTML and is NOT translated here.

export const ar = {
  // ── page header ──────────────────────────────────────────────────────────────
  "notifications.title": "الإشعارات",
  "notifications.subtitle": "إشعاراتك الخاصة — اضغط على إشعار للانتقال إلى مصدره.",
  "notifications.breadcrumbs.home": "الرئيسية",
  "notifications.breadcrumbs.notifications": "الإشعارات",
  "notifications.markAllRead": "تحديد الكل كمقروء",
  "notifications.markAllRead.noneReason": "لا توجد إشعارات لتحديدها",

  // ── tabs ─────────────────────────────────────────────────────────────────────
  "notifications.tab.all": "الكل",
  "notifications.tab.unread": "غير المقروءة",

  // ── denied ───────────────────────────────────────────────────────────────────
  "notifications.denied.title": "الإشعارات غير متاحة لصلاحياتك",
  "notifications.denied.message":
    "لا تملك صلاحية عرض الإشعارات. إن كنت تظن أنه ينبغي أن تصل إليها، تواصل مع المسؤول.",

  // ── empty states ─────────────────────────────────────────────────────────────
  "notifications.empty.title": "لا توجد إشعارات",
  "notifications.empty.unread": "لا توجد إشعارات غير مقروءة — أنت على اطّلاع بكل جديد.",
  "notifications.empty.all": "ستظهر هنا إشعاراتك عند وصول أي تحديث يخصّك.",

  // ── columns ──────────────────────────────────────────────────────────────────
  "notifications.columns.type": "النوع",
  "notifications.columns.content": "الإشعار",
  "notifications.columns.createdAt": "الوقت",
  "notifications.unreadSuffix": "(غير مقروء)",
};

export const en = {
  // ── page header ──────────────────────────────────────────────────────────────
  "notifications.title": "Notifications",
  "notifications.subtitle": "Your notifications — click one to go to its source.",
  "notifications.breadcrumbs.home": "Home",
  "notifications.breadcrumbs.notifications": "Notifications",
  "notifications.markAllRead": "Mark all as read",
  "notifications.markAllRead.noneReason": "No notifications to mark",

  // ── tabs ─────────────────────────────────────────────────────────────────────
  "notifications.tab.all": "All",
  "notifications.tab.unread": "Unread",

  // ── denied ───────────────────────────────────────────────────────────────────
  "notifications.denied.title": "Notifications are not available with your permissions",
  "notifications.denied.message":
    "You don't have permission to view notifications. If you think you should have access, contact your administrator.",

  // ── empty states ─────────────────────────────────────────────────────────────
  "notifications.empty.title": "No notifications",
  "notifications.empty.unread": "No unread notifications — you're all caught up.",
  "notifications.empty.all": "Your notifications will appear here when an update concerns you.",

  // ── columns ──────────────────────────────────────────────────────────────────
  "notifications.columns.type": "Type",
  "notifications.columns.content": "Notification",
  "notifications.columns.createdAt": "Time",
  "notifications.unreadSuffix": "(unread)",
};
