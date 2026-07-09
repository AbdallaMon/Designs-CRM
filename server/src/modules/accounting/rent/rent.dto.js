// accounting/rent DTO — per-record `capabilities.*` (FE hint; routes remain the source
// of truth). Pure: no Prisma, no side effects.
import { computeCapabilities, hasPermission, PERMISSIONS } from "@dms/shared";

const P = PERMISSIONS.ACCOUNTING;

export function computeRentCapabilities(record, authUser) {
  const permissions = authUser?.permissions ?? [];
  return computeCapabilities(
    {
      canRenew: () => hasPermission(permissions, P.RENT_RENEW),
      canEdit: () => hasPermission(permissions, P.RENT_RENEW),
    },
    {},
  );
}

export function withRentListCapabilities(items, authUser) {
  if (!Array.isArray(items)) return items;
  return items.map((record) => ({ ...record, capabilities: computeRentCapabilities(record, authUser) }));
}

// ── row-shaping (relocated from the legacy accountant service) ──────────────────────
// Legacy collapsed the `rentPeriods` array (a take:1 latest-period read) to a single object
// (or null). Pure — no Prisma, no side effects.
export function shapeRentRow(rent) {
  return { ...rent, rentPeriods: rent.rentPeriods[0] || null };
}

export function shapeRentList(rents) {
  return rents.map((rent) => ({
    ...rent,
    rentPeriods: rent.rentPeriods[0] || null,
  }));
}
