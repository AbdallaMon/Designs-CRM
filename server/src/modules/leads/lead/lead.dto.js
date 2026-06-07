// leads/lead DTO — output shaping + per-record `capabilities.*` (FE rendering hints;
// the server checkers remain the source of truth). Pure: no Prisma, no side effects.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS.LEAD;

// Statuses a NON-admin user cannot transition AWAY from (legacy updateClientLeadStatus
// rule). Used only to derive `canChangeStatus` for the UI; the route still enforces.
const LOCKED_FROM_STATUSES_FOR_NON_ADMIN = ["FINALIZED", "REJECTED", "ARCHIVED", "ON_HOLD"];

/**
 * Decide whether `authUser` writes this lead, mirroring the scope checker:
 * full-scope roles (ADMIN/SUPER_ADMIN/ACCOUNTANT/isSuperSales) may mutate any lead;
 * everyone else only their own assigned lead.
 */
function canMutateLead({ record, authUser }) {
  if (authUser?.isSuperSales) return true;
  if (["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(authUser?.role)) return true;
  return record?.userId != null && Number(record.userId) === Number(authUser?.id);
}

function isFullScope(authUser) {
  return (
    Boolean(authUser?.isSuperSales) ||
    ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"].includes(authUser?.role)
  );
}

/** Capabilities for a single lead record (list row or detail). */
export function computeLeadCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  const mutable = canMutateLead({ record, authUser });
  const admin = isFullScope(authUser);
  return computeCapabilities(
    {
      canEdit: () => hasPermission(permissions, P.EDIT) && mutable,
      canChangeStatus: () =>
        hasPermission(permissions, P.CHANGE_STATUS) &&
        mutable &&
        (admin || !LOCKED_FROM_STATUSES_FOR_NON_ADMIN.includes(record?.status)),
      canConvert: () => hasPermission(permissions, P.CONVERT) && mutable,
      canAssignToOther: () => hasPermission(permissions, P.ASSIGN_OTHER),
      canAssignSelf: () =>
        hasPermission(permissions, P.ASSIGN_SELF) &&
        (record?.status === "NEW" || record?.status === "ON_HOLD"),
      canAddCall: () => hasPermission(permissions, P.CALL_MANAGE) && mutable,
      canAddMeeting: () => hasPermission(permissions, P.MEETING_MANAGE) && mutable,
      canAddPriceOffer: () => hasPermission(permissions, P.PRICE_OFFER_MANAGE) && mutable,
      canAddPayment: () => hasPermission(permissions, P.PAYMENT_MANAGE) && mutable,
      canAddFile: () => hasPermission(permissions, P.FILE_MANAGE) && mutable,
      canAddNote: () => hasPermission(permissions, P.NOTE_MANAGE) && mutable,
      canSendReminder: () => hasPermission(permissions, P.REMINDER_SEND) && mutable,
    },
    {},
  );
}

/** Attach capabilities to a list of lead-shaped records. */
export function withListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({ ...record, capabilities: computeLeadCapabilities(record, authUser) }));
}

/** Attach capabilities to a single detail record. */
export function withDetailCapabilities(record, authUser) {
  if (!record) return record;
  return { ...record, capabilities: computeLeadCapabilities(record, authUser) };
}

/** Normalize a legacy `{ data, total, totalPages }` (or a bare array + count) to the
 *  CONTRACT pagination shape `{ items, total, page, pageSize }`. */
export function toPaginated({ items, total, page, pageSize }) {
  return { items, total, page, pageSize };
}
