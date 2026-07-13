// notifications controller — thin. Reads validated input + the authenticated user,
// delegates to the usecase, responds via the shared envelope helpers. No business rules.
// The subject user is taken from req.auth (the session) inside the usecase — the
// controller never forwards a client-supplied target user.
import { ok } from "../../shared/http/response.js";
import { notificationsMessagesCodes, messagesNames } from "@dms/shared";
import { notificationUsecase } from "./notification.usecase.js";

const TK = messagesNames.notificationsMessages;

class NotificationController {
  // GET /v2/notifications — paginated all-notifications for the authenticated user.
  async getNotifications(req, res) {
    const data = await notificationUsecase.listNotifications({
      query: req.query,
      authUser: req.auth,
      unreadOnly: false,
    });
    return ok(res, data, notificationsMessagesCodes.NOTIFICATIONS_FETCHED, TK);
  }

  // GET /v2/notifications/unread — paginated UNREAD notifications for the authenticated user.
  async listUnread(req, res) {
    const data = await notificationUsecase.listNotifications({
      query: req.query,
      authUser: req.auth,
      unreadOnly: true,
    });
    return ok(res, data, notificationsMessagesCodes.UNREAD_NOTIFICATIONS_FETCHED, TK);
  }

  // POST /v2/notifications/actions/mark-read — mark the authenticated user's notifications read.
  async markRead(req, res) {
    const data = await notificationUsecase.markRead({ authUser: req.auth });
    return ok(res, data, notificationsMessagesCodes.NOTIFICATIONS_MARKED_READ, TK);
  }
}

export const notificationController = new NotificationController();
export { NotificationController };
