// notifications controller — thin. Reads validated input + the authenticated user,
// delegates to the usecase, responds via the shared envelope helpers. No business rules.
// The subject user is taken from req.auth (the session) inside the usecase — the
// controller never forwards a client-supplied target user.
import { ok } from "../../shared/http/response.js";
import { notificationsMessagesCodes, messagesNames } from "@dms/shared";
import { notificationUsecase } from "./notification.usecase.js";

const C = notificationsMessagesCodes;
const TK = messagesNames.notificationsMessages;

export class NotificationController {
  constructor(usecase) {
    this.usecase = usecase;
  }

  // GET /v2/notifications — paginated all-notifications for the authenticated user.
  list = async (req, res) => {
    const data = await this.usecase.list({
      query: req.query,
      authUser: req.auth,
      unreadOnly: false,
    });
    return ok(res, data, C.NOTIFICATIONS_FETCHED, TK);
  };

  // GET /v2/notifications/unread — paginated UNREAD notifications for the authenticated user.
  listUnread = async (req, res) => {
    const data = await this.usecase.list({
      query: req.query,
      authUser: req.auth,
      unreadOnly: true,
    });
    return ok(res, data, C.UNREAD_NOTIFICATIONS_FETCHED, TK);
  };

  // POST /v2/notifications/actions/mark-read — mark the authenticated user's notifications read.
  markRead = async (req, res) => {
    const data = await this.usecase.markRead({ authUser: req.auth });
    return ok(res, data, C.NOTIFICATIONS_MARKED_READ, TK);
  };
}

export const notificationController = new NotificationController(notificationUsecase);
