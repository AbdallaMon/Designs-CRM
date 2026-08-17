import { CONTRACT_SESSION_STATUSES } from "@dms/shared";
export const contractSessionStatusFlow = {
  INITIAL: {
    next: CONTRACT_SESSION_STATUSES.SIGNING,
    back: null,
  },
  SIGNING: {
    next: CONTRACT_SESSION_STATUSES.REGISTERED,
    back: CONTRACT_SESSION_STATUSES.INITIAL,
  },
  REGISTERED: {
    next: null,
    back: CONTRACT_SESSION_STATUSES.SIGNING,
  },
};

export function isContractUtilityReady(contractUtility) {
  return Boolean(contractUtility && typeof contractUtility === "object");
}
