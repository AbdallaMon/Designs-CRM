// notifications usecase — business logic / orchestration. Prisma NEVER appears here
// (only repo calls). Behavior is ported 1:1 from the legacy handlers
// (routes/utility/utility.js + routes/shared/utilities.js) and the legacy
// getNotifications / markLatestNotificationsAsRead service, with ONE deliberate security
// change: the subject user is ALWAYS the authenticated caller (authUser.id), never a
// client-supplied userId/staffId.
//
// ════════════════════════════════════════════════════════════════════════════════════
//  THE IDOR FIX
// ════════════════════════════════════════════════════════════════════════════════════
//  Legacy `getNotifications(searchParams, ...)` did `where.userId =
//  Number(searchParams.userId)` — it read WHOSE notifications from a client-supplied
//  query param — and the route was UNAUTHENTICATED. `markLatestNotificationsAsRead`
//  trusted the `:userId` PATH param, also unauthenticated. So any caller could read or
//  mark-read ANY user's notifications. Here:
//    - the route is authenticated (requireAuth) + gated by a NOTIFICATION code, and
//    - `userId` is taken from `authUser.id` ONLY. The legacy `searchParams.userId` /
//      `filters.staffId` selectors are ignored. A user can only ever touch their own rows.
import { notificationRepository } from "./notification.repository.js";
import { NotificationDto } from "./notification.dto.js";

export class NotificationUsecase {
  /**
   * @param {import("./notification.repository.js").NotificationRepository} repository
   */
  constructor(repository) {
    this.repo = repository;
  }

  // Parse the legacy `filters` JSON string for an optional date range only. Any
  // `staffId`/`userId` inside it is intentionally NOT used (the IDOR fix).
  #parseRange(query) {
    try {
      const filters = query?.filters ? JSON.parse(query.filters) : null;
      return filters?.range ?? null;
    } catch {
      return null;
    }
  }

  // GET own notifications (paginated). `unreadOnly` distinguishes the legacy `unread`
  // endpoint (true) from the all-notifications endpoint (false).
  async list({ query, authUser, unreadOnly }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.limit) || 9;
    const skip = (page - 1) * pageSize;
    const range = this.#parseRange(query);

    const { notifications, total } = await this.repo.list({
      userId: authUser.id, // ← derived from the authenticated session, never client input
      range,
      unreadOnly,
      skip,
      take: pageSize,
    });

    return NotificationDto.toPaginatedList({ notifications, total, page, pageSize });
  }

  // POST mark own latest notifications as read. Self-scoped to authUser.id.
  async markRead({ authUser }) {
    const result = await this.repo.markAllReadForUser({ userId: authUser.id });
    return { updated: result.count };
  }
}

export const notificationUsecase = new NotificationUsecase(notificationRepository);
