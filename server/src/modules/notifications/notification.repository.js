// notifications repository — Prisma I/O ONLY (no business rules, no AppError).
//
// Ported from the legacy `getNotifications` / `markLatestNotificationsAsRead`
// (services/main/utility/utility.js), but with the IDOR removed: the legacy code set
// `where.userId = Number(searchParams.userId)` (a CLIENT-SUPPLIED query param) and the
// mark-read trusted the `:userId` PATH param. Here the `userId` is ALWAYS supplied by
// the usecase from `req.auth.id` — never from request input. Every query in this repo is
// constrained by that authenticated userId, so a caller can only ever touch their OWN
// notifications.
import prisma from "../../infra/prisma/prisma.js";
import dayjs from "dayjs";

class NotificationRepository {
  model = prisma.notification;

  // Self-scoped notification list. `userId` is the AUTHENTICATED user's id (never client
  // input). `range` is an optional { startDate, endDate } already parsed by the usecase.
  // The createdAt window matches legacy: explicit range, else the last 30 days.
  buildWhere({ userId, range, unreadOnly }) {
    const where = { userId: Number(userId) };

    if (range && (range.startDate || range.endDate)) {
      const now = dayjs();
      const start = range.startDate ? dayjs(range.startDate) : now.subtract(30, "days");
      const end = range.endDate ? dayjs(range.endDate).endOf("day") : now;
      where.createdAt = { gte: start.toDate(), lte: end.toDate() };
    } else {
      where.createdAt = {
        gte: dayjs().subtract(30, "days").toDate(),
        lte: dayjs().toDate(),
      };
    }

    if (unreadOnly) where.isRead = false;
    return where;
  }

  async list({ userId, range, unreadOnly, skip, take }) {
    const where = this.buildWhere({ userId, range, unreadOnly });

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          staff: { select: { name: true } },
          clientLead: {
            select: { client: { select: { name: true } } },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  // Mark the AUTHENTICATED user's unread notifications as read. The userId is bound into
  // the where clause, so this can never affect another user's rows (the IDOR fix).
  async markAllReadForUser({ userId, client }) {
    const db = client ?? prisma;
    return db.notification.updateMany({
      where: { isRead: false, userId: Number(userId) },
      data: { isRead: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
export { NotificationRepository };
