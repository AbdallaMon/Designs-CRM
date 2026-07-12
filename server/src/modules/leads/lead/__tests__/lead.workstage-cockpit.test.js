// Unit tests for the PURE work-stage next-action engine (designers/executor). No Prisma,
// no clock — `now` is injected. The engine trusts a caller-scoped `assignments` input.
import { describe, it, expect } from "vitest";
import {
  computeWorkStageActions,
  workStageActionsForLead,
  DELIVERY_SOON_HOURS,
  PROJECT_TYPE_TO_LEVEL,
} from "../lead.workstage-cockpit.js";

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

describe("computeWorkStageActions — deadline rules (My Day)", () => {
  const hoursFromNow = (h) => new Date(NOW.getTime() + h * 3600_000);
  const base = {
    projectType: "3D_Designer",
    contractLevel: "LEVEL_3",
    projectStatus: "IN_PROGRESS",
    stageStatus: "IN_PROGRESS",
  };

  it("DELIVERY_OVERDUE (critical) when the deadline passed", () => {
    expect(DELIVERY_SOON_HOURS).toBe(48);
    expect(PROJECT_TYPE_TO_LEVEL["3D_Designer"]).toBe("LEVEL_3");
    const r = computeWorkStageActions(
      { assignments: [{ ...base, deliveryAt: hoursFromNow(-72) }] },
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      type: "DELIVERY_OVERDUE",
      severity: "critical",
      params: { projectType: "3D_Designer", level: "LEVEL_3", overdueDays: 3 },
    });
    expect(r[0].params.deliveryAt).toBe(hoursFromNow(-72).toISOString());
  });

  it("STAGE_DUE_SOON (warning) inside the 48h window", () => {
    const r = computeWorkStageActions(
      { assignments: [{ ...base, deliveryAt: hoursFromNow(24) }] },
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({
      type: "STAGE_DUE_SOON",
      severity: "warning",
      params: { projectType: "3D_Designer", level: "LEVEL_3", hoursLeft: 24 },
    });
  });

  it("falls back to WORK_STAGE_ASSIGNED_TO_YOU beyond the window", () => {
    const r = computeWorkStageActions(
      { assignments: [{ ...base, deliveryAt: hoursFromNow(49) }] },
      NOW,
    );
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe("WORK_STAGE_ASSIGNED_TO_YOU");
  });

  it("no deliveryAt → unchanged legacy behavior (one ASSIGNED signal)", () => {
    const r = computeWorkStageActions({ assignments: [{ ...base }] }, NOW);
    expect(r).toHaveLength(1);
    expect(r[0].type).toBe("WORK_STAGE_ASSIGNED_TO_YOU");
  });

  it("completed assignments stay silent even when overdue", () => {
    const r = computeWorkStageActions(
      { assignments: [{ ...base, projectStatus: "COMPLETED", stageStatus: "COMPLETED", deliveryAt: hoursFromNow(-72) }] },
      NOW,
    );
    expect(r).toEqual([]);
  });
});
