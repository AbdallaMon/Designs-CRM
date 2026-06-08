// Notifications data-access service — the ONLY place that talks to the notifications API.
// Wraps the canonical apiFetch (config.apiUrl === /v2). Components/hooks call these helpers,
// never fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.
//
// The whole surface is AUTHED + SELF-SCOPED (subject is always req.auth.id server-side). The
// FE NEVER sends a target userId.
//
// §5c CONTRACT DELTAS applied here:
//   • list/listUnread return data normalized to { items, total, page, pageSize } (the BE dto
//     does the normalization; legacy was { data, totalPages, total }).
//   • markRead is POST /notifications/actions/mark-read with an EMPTY body — no client userId
//     (the BE schema is .strict() and would 422 on any smuggled field).

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  NOTIFICATIONS_URL,
  NOTIFICATIONS_UNREAD_URL,
  NOTIFICATIONS_MARK_READ_URL,
} from "./config/constant.js";

// Build a query string with top-level params (skips empty/null/undefined).
function buildQuery(base, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

export const notificationsService = {
  // GET / — paginated self notifications → data { items, total, page, pageSize }  [notification.list]
  list: (params = {}) => apiFetch.get(buildQuery(NOTIFICATIONS_URL, params)),
  // GET /unread — paginated unread self notifications → data { items, total, page, pageSize } [notification.list]
  listUnread: (params = {}) => apiFetch.get(buildQuery(NOTIFICATIONS_UNREAD_URL, params)),
  // POST /actions/mark-read — mark own notifications read; EMPTY body, self-scoped  [notification.mark_read]
  markRead: () => apiFetch.post(NOTIFICATIONS_MARK_READ_URL, {}),
};

export default notificationsService;
