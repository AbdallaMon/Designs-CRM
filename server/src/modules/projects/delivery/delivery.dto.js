// projects/delivery DTO — per-record `capabilities.*` (FE rendering hints; server
// checkers remain the source of truth). Pure: no Prisma.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS;

export function computeDeliveryCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  return computeCapabilities(
    {
      canLinkMeeting: () => hasPermission(permissions, P.DELIVERY.LINK_MEETING),
      canDelete: () => hasPermission(permissions, P.DELIVERY.DELETE),
    },
    {},
  );
}

export function withDeliveryListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({ ...record, capabilities: computeDeliveryCapabilities(record, authUser) }));
}
