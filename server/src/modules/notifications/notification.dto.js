// notifications DTO — output shaping only (pure, no Prisma). Normalizes the list result
// to the shared paginated contract shape `{ items, total, page, pageSize }` (legacy
// returned `{ data, totalPages, total }`).
export class NotificationDto {
  static toPaginatedList({ notifications, total, page, pageSize }) {
    return {
      items: notifications,
      total,
      page,
      pageSize,
    };
  }
}
