// Notifications domain — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). One place to edit if a backend path
// changes (reconciliation point vs server/src/modules/notifications/notification.route.js).
//
// Backend contract (confirmed against notification.route.js + notification.dto.js):
//   SELF-SCOPED notification surface, mounted at /v2/notifications. Auth mounted ONCE at the
//   router (the legacy `/utility/notification/*` endpoints were UNAUTHENTICATED — this is the
//   security fix). The subject user is ALWAYS req.auth.id — NO route accepts a client-supplied
//   target userId (the IDOR fix).
//
//   GET  /                 ?page=&limit=&filters=   → paginated notifications   [notification.list]
//   GET  /unread           ?page=&limit=&filters=   → unread notifications      [notification.list]
//   POST /actions/mark-read   body: {} (.strict)     → mark own notifications read [notification.mark_read]
//
// §5c CONTRACT DELTAS baked in here:
//   • LIST SHAPE: lists are normalized to { items, total, page, pageSize } (legacy returned
//     { data, totalPages, total }). The dto (NotificationDto.toPaginatedList) does this server
//     side — the FE reads `data.items` / `data.total` / `data.page` / `data.pageSize`.
//   • MARK-READ: the action is POST /actions/mark-read with NO client `:userId` in the path
//     and an EMPTY (.strict) body — the subject is the authenticated caller (self-scoped).
//     The legacy POST /utility/notification/users/:userId is GONE.

export const NOTIFICATIONS_BASE = "notifications";

export const NOTIFICATIONS_URL = NOTIFICATIONS_BASE; // GET / (paginated)
export const NOTIFICATIONS_UNREAD_URL = `${NOTIFICATIONS_BASE}/unread`; // GET /unread
export const NOTIFICATIONS_MARK_READ_URL = `${NOTIFICATIONS_BASE}/actions/mark-read`; // POST (self-scoped)
