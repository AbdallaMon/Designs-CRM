// leads/lead — pure work-stage next-action engine for designers / executor.
//
// The lead cockpit (`computeCockpit`) is sales/accountant/admin-scoped and its endpoint
// is lead-access-scoped — designers never pass it. Designers work on their OWN assigned
// production stages, so their "what do I do next" is derived HERE, from the caller's own
// `Assignment` rows on this lead's projects. The read layer MUST only pass assignments
// where `Assignment.userId === caller` — this engine does NOT re-check ownership; it
// trusts a caller-scoped input (mirrors the lead cockpit's route-enforced scope).
//
// PURE: no Prisma, no I/O; the clock `now` is injected (kept for signature symmetry with
// `computeCockpit`, and so future time-based rules stay deterministic).
//
// Emits language-neutral signals only — all human copy is resolved on the frontend.

function arr(v) {
  return Array.isArray(v) ? v : [];
}

/**
 * Next-action list for a designer/executor on ONE lead, scoped to their own assignments.
 * @param {{ assignments?: Array<{ projectType: string, contractLevel: string, projectStatus: string, stageStatus: string }> }} input
 *   `assignments` — the CALLER's own project assignments on this lead (already scoped by userId).
 * @param {Date} now  reference clock (REQUIRED, injected — never read internally).
 * @returns {Array<{ type: 'WORK_STAGE_ASSIGNED_TO_YOU', severity: string, params: { projectType, level }, cta: object }>}
 */
export function computeWorkStageActions({ assignments } = {}, now) {
  if (!(now instanceof Date)) {
    throw new TypeError("computeWorkStageActions: `now` (a Date) is required — inject the clock for determinism.");
  }
  return arr(assignments)
    .filter((a) => a && (a.projectStatus === "IN_PROGRESS" || a.stageStatus === "IN_PROGRESS"))
    .map((a) => ({
      type: "WORK_STAGE_ASSIGNED_TO_YOU",
      severity: "warning",
      params: { projectType: a.projectType, level: a.contractLevel },
      cta: { kind: "GOTO_WORKSTAGE", capability: null, tabKey: null },
    }));
}

// Contract LEVEL_N → production project type (mirrors the frozen contract service's
// `stageLevelRelatedProject`; used here only to label the signal, inverted).
const PROJECT_TYPE_TO_LEVEL = {
  "2D_Study": "LEVEL_2",
  "3D_Designer": "LEVEL_3",
  "2D_Final_Plans": "LEVEL_4",
  "2D_Quantity_Calculation": "LEVEL_5",
};

// Legacy Project.status strings that mean the stage is finished → no action for the designer.
// (Project.status is a free-form per-type label, e.g. "In Progress"/"Completed" — NOT the
// ContractStage enum; anything not clearly terminal is treated as active.)
const DONE_PROJECT_STATUSES = new Set(["Completed", "Accepted", "Rejected", "Archived"]);

/**
 * Adapter: derive a caller's work-stage actions from a legacy `lead.projects[]` (as returned
 * by `getLeadDetailsByProject`). `lead.projects` is already scoped to the caller for designers;
 * we ALSO filter to the caller's own assignments so admin/accountant callers (who see all
 * projects) don't get another user's work-stage as "theirs". Not pure (defaults the clock) —
 * this is the wiring adapter, not the engine.
 * @param {object} lead    the lead object carrying `projects[]`
 * @param {number} userId  the caller's user id
 * @param {Date}   [now]   injectable clock (defaults to wall clock)
 */
export function workStageActionsForLead(lead, userId, now = new Date()) {
  const uid = Number(userId);
  const assignments = arr(lead?.projects)
    .filter((p) => arr(p.assignments).some((a) => Number(a?.user?.id) === uid))
    .map((p) => ({
      projectType: p.type,
      contractLevel: PROJECT_TYPE_TO_LEVEL[p.type] ?? null,
      projectStatus: p.status,
      stageStatus: p.status && !DONE_PROJECT_STATUSES.has(p.status) ? "IN_PROGRESS" : "COMPLETED",
    }));
  return computeWorkStageActions({ assignments }, now);
}
