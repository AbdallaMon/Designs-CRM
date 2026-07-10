// projects/project constants — the canonical project-type ordering used by the
// project-group creation + designer-board sorting. Moved verbatim from the legacy
// shared/legacy/project-services.js (behavior-preserving; no value change).
export const PROJECT_TYPES = [
  "2D_Study",
  "3D_Designer",
  "3D_Modification",
  "2D_Final_Plans",
  "2D_Quantity_Calculation",
];

// Project board statuses a NON-admin user cannot transition AWAY from (legacy
// updateProject rule). Single source of truth for the usecase workflow-guard
// (re-exported via project-scope.js) and the dto `canEditStatus` capability.
export const LOCKED_FROM_STATUSES_FOR_NON_ADMIN = ["Completed", "Canceled", "Rejected"];
