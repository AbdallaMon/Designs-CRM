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
import { notificationRepository } from "./notification.repo.js";
import { NotificationDto } from "./notification.dto.js";
import { getIo } from "../../infra/socket/index.js";
import { sendEmail } from "../../infra/mail/send-mail.js";

export class NotificationUsecase {
  /**
   * @param {import("./notification.repo.js").NotificationRepository} repository
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

// ── Notification fan-out (ported VERBATIM from the former utilities/legacy/utility.js) ──
// Orchestration only: resolves recipients + emits the socket event + sends the email via
// infra; every Prisma read/write is delegated to notificationRepository. Behavior, HTML,
// env-vars, and quirks are preserved 1:1. Consumed by infra/notifications helpers.
export async function createNotification(
  userId,
  isAdmin,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId,
  role = ["STAFF"],
  specifiRole,
) {
  let subAdmins = [];
  const forAll = !userId && !isAdmin && !staffId;

  if (isAdmin) {
    const admin = await notificationRepository.findFirstAdmin();
    subAdmins = await notificationRepository.findSubAdmins();
    await sendNotification(
      admin.id,
      content,
      href,
      type,
      emailSubject,
      withEmail,
      contentType,
      clientLeadId,
      staffId,
    );
    if (subAdmins?.length > 0) {
      subAdmins.forEach(async (admin) => {
        await sendNotification(
          admin.id,
          content,
          href,
          type,
          emailSubject,
          withEmail,
          contentType,
          clientLeadId,
          staffId,
        );
      });
    }
  }
  if (specifiRole) {
    const users = await notificationRepository.findActiveUsersByRoles({
      roles: role,
    });
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId,
      );
    });
  } else if (forAll) {
    const users = await notificationRepository.findActiveDefaultRecipients();
    users?.map(async (user) => {
      await sendNotification(
        user.id,
        content,
        href,
        type,
        emailSubject,
        withEmail,
        contentType,
        clientLeadId,
      );
    });
  } else if (userId) {
    await sendNotification(
      userId,
      content,
      href,
      type,
      emailSubject,
      withEmail,
      contentType,
      clientLeadId,
      staffId,
    );
  }
}

async function sendNotification(
  userId,
  content,
  href,
  type,
  emailSubject,
  withEmail,
  contentType = "TEXT",
  clientLeadId,
  staffId,
) {
  const link = href
    ? `<a href="${process.env.LEGACY_DASHBOARD_ORIGIN}${href}" style="color: #1a73e8; text-decoration: none;">See details from here</a>`
    : "";
  const emailContent = `
        <div style=" color: #333; direction: ltr; text-align: left;">
            <h2 style="color: #444; margin-bottom: 16px;">${emailSubject}</h2>
            <p style="font-size: 16px; line-height: 1.5;">${content}</p>
            ${link ? `<p>${link}</p>` : ""}
        </div>
    `;
  let notification = await notificationRepository.createNotificationRow({
    data: {
      userId: userId,
      content: content,
      type,
      link: href,
      contentType,
      clientLeadId: clientLeadId && Number(clientLeadId),
      staffId: staffId && Number(staffId),
    },
  });

  const io = getIo();
  io.to(`user:${userId}`).emit("notification", notification);
  if (withEmail) {
    const user = await notificationRepository.findUserEmailById({ userId });
    if (user && user.email) {
      const email = `
<div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
    <div>
        ${emailContent}
    </div>
    <div style="margin-top: 10px;">
        <a href="${process.env.LEGACY_DASHBOARD_ORIGIN}/dashboard/notifications" style="color: #007bff; text-decoration: none;">
            Go to notifications?
        </a>
    </div>
</div>
`;

      setImmediate(() => {
        sendEmail(user.email, emailSubject, email)
          .then(() => {
            console.log(`Email sent to user ${userId} regarding notification.`);
          })
          .catch((error) => {
            console.error(`Failed to send email to user ${userId}:`, error);
          });
      });
    }
  }
}
