// leads/lead DTO — output shaping + per-record `capabilities.*` (FE rendering hints;
// the server checkers remain the source of truth). Pure: no Prisma, no side effects.
import { LEAD_STATUSES, PROFILES, computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS.LEAD;

// Statuses a NON-admin user cannot transition AWAY from (legacy updateClientLeadStatus
// rule). Used only to derive `canChangeStatus` for the UI; the route still enforces.
const LOCKED_FROM_STATUSES_FOR_NON_ADMIN = [LEAD_STATUSES.FINALIZED, LEAD_STATUSES.REJECTED, "ARCHIVED", LEAD_STATUSES.ON_HOLD];

/**
 * Decide whether `authUser` writes this lead, mirroring the scope checker:
 * full-scope roles (ADMIN/SUPER_ADMIN/ACCOUNTANT/SUPER_SALES profile) may mutate any
 * lead; everyone else only their own assigned lead.
 */
function canMutateLead({ record, authUser }) {
  if (isFullScope(authUser)) return true;
  return record?.userId != null && Number(record.userId) === Number(authUser?.id);
}

function isFullScope(authUser) {
  return (
    Boolean(authUser?.isAdminTier) ||
    authUser?.currentProfileKey === PROFILES.SUPER_SALES ||
    authUser?.currentProfileKey === PROFILES.ACCOUNTANT
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
      // Convert ("تحويل إلى صفقة") frees an ASSIGNED lead back to the ON_HOLD pool; it
      // is meaningless (and crashes the legacy owner-notification) on an unassigned lead.
      canConvert: () => hasPermission(permissions, P.CONVERT) && mutable && record?.userId != null,
      canAssignToOther: () => hasPermission(permissions, P.ASSIGN_OTHER),
      canAssignSelf: () =>
        hasPermission(permissions, P.ASSIGN_SELF) &&
        (record?.status === LEAD_STATUSES.NEW || record?.status === LEAD_STATUSES.ON_HOLD),
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

/**
 * Cockpit DTO — the read-only Sales Deal Cockpit response `data`. Combines the pure
 * `computeCockpit` output (`{ health, actions }`) with the per-record capabilities so
 * the FE gates each action CTA with the SAME predicate as the tab actions. `record` is
 * the narrow cockpit bundle (it carries `userId`/`status`, which is all
 * `computeLeadCapabilities` reads). Pure: no Prisma, no side effects.
 */
export function toCockpitDto(computed, record, authUser) {
  return {
    health: computed.health,
    actions: computed.actions,
    capabilities: computeLeadCapabilities(record, authUser),
  };
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

// ── Kanban / columns record shaping (ported verbatim from the legacy read aggregators
// getClientLeadsByDateRange / getClientLeadsColumnStatus tails). Pure array/record
// transforms — no Prisma, no side effects.

/** Deals (kanban) shaping: when a contractLevel filter is active, keep only leads whose
 *  active contract has that stage IN_PROGRESS. */
export function filterDealsByContractLevel(clientLeads, filters) {
  let result = clientLeads;
  if (filters.contractLevel && filters.contractLevel !== "all") {
    result = result.filter((lead) => {
      if (lead.contracts.length) {
        return lead.contracts[0].stages?.some((stage) => {
          return (
            stage.title === filters.contractLevel &&
            stage.stageStatus === LEAD_STATUSES.IN_PROGRESS
          );
        });
      }
    });
  }
  return result;
}

/** Columns shaping: decorate each lead's active contract with its current (or the
 *  contractLevel-matched) IN_PROGRESS stage. */
export function mapColumnLeadsContractStage(clientLeads, filters) {
  let result = clientLeads;
  result = result.map((lead) => {
    if (lead.contracts.length) {
      let contractZeroStage;
      if (filters.contractLevel && filters.contractLevel !== "all") {
        contractZeroStage = lead.contracts[0]?.stages?.find(
          (stage) =>
            stage.title === filters.contractLevel &&
            stage.stageStatus === LEAD_STATUSES.IN_PROGRESS,
        );
      } else {
        contractZeroStage = lead.contracts[0]?.stages?.find(
          (stage) => stage.stageStatus === LEAD_STATUSES.IN_PROGRESS,
        );
      }
      lead.contracts[0].stage = contractZeroStage;
      lead.contracts[0].contractLevel = contractZeroStage?.title;
    }
    return lead;
  });
  return result;
}
