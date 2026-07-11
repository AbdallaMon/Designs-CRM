// Unit tests for the PURE work-stage next-action engine (designers/executor). No Prisma,
// no clock — `now` is injected. The engine trusts a caller-scoped `assignments` input.
import { describe, it, expect } from "vitest";
import { computeWorkStageActions, workStageActionsForLead } from "../lead.workstage-cockpit.js";

const NOW = new Date("2026-07-10T12:00:00.000Z");

describe("computeWorkStageActions", () => {
  it("emits WORK_STAGE_ASSIGNED_TO_YOU for an in-progress assigned stage", () => {
    const r = computeWorkStageActions(
      { assignments: [{ projectType: "3D_Designer", contractLevel: "LEVEL_3", projectStatus: "IN_PROGRESS", stageStatus: "IN_PROGRESS" }] },
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      type: "WORK_STAGE_ASSIGNED_TO_YOU",
      severity: "warning",
      params: { projectType: "3D_Designer", level: "LEVEL_3" },
    });
    expect(r[0].cta).toMatchObject({ kind: "GOTO_WORKSTAGE", capability: null });
  });

  it("ignores completed / not-started stages", () => {
    const r = computeWorkStageActions(
      { assignments: [{ projectType: "2D_Study", contractLevel: "LEVEL_2", projectStatus: "COMPLETED", stageStatus: "COMPLETED" }] },
      NOW,
    );
    expect(r).toEqual([]);
  });

  it("returns [] when the caller has no assignments", () => {
    expect(computeWorkStageActions({ assignments: [] }, NOW)).toEqual([]);
    expect(computeWorkStageActions({}, NOW)).toEqual([]);
  });

  it("requires an injected Date clock", () => {
    expect(() => computeWorkStageActions({ assignments: [] })).toThrow(TypeError);
  });
});

describe("workStageActionsForLead (legacy lead.projects adapter)", () => {
  const lead = (projects) => ({ id: 5, projects });

  it("emits an action for a project assigned to the caller that is still active", () => {
    const r = workStageActionsForLead(
      lead([{ type: "3D_Designer", status: "In Progress", assignments: [{ user: { id: 42 } }] }]),
      42,
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ type: "WORK_STAGE_ASSIGNED_TO_YOU", params: { projectType: "3D_Designer", level: "LEVEL_3" } });
  });

  it("does NOT emit for a project assigned to a DIFFERENT user (IDOR guard)", () => {
    const r = workStageActionsForLead(
      lead([{ type: "3D_Designer", status: "In Progress", assignments: [{ user: { id: 99 } }] }]),
      42,
      NOW,
    );
    expect(r).toEqual([]);
  });

  it("does NOT emit for a completed project", () => {
    const r = workStageActionsForLead(
      lead([{ type: "2D_Study", status: "Completed", assignments: [{ user: { id: 42 } }] }]),
      42,
      NOW,
    );
    expect(r).toEqual([]);
  });

  it("returns [] for a lead with no projects", () => {
    expect(workStageActionsForLead(lead([]), 42, NOW)).toEqual([]);
    expect(workStageActionsForLead(null, 42, NOW)).toEqual([]);
  });
});
