import { describe, expect, it } from "vitest";

import {
  getCurrentContractStage,
  getLatestLeadActivity,
  getLeadAgeDays,
  getLeadNextAction,
} from "../lead-card-signals.js";

const NOW = new Date("2026-08-18T12:00:00.000Z");

describe("lead card signals", () => {
  it("selects the nearest upcoming open call", () => {
    const action = getLeadNextAction(
      [
        { status: "IN_PROGRESS", time: "2026-08-20T12:00:00.000Z" },
        { status: "IN_PROGRESS", time: "2026-08-18T14:00:00.000Z" },
      ],
      { now: NOW },
    );

    expect(action).toMatchObject({
      kind: "CALL",
      dueAt: "2026-08-18T14:00:00.000Z",
      overdue: false,
    });
  });

  it("prioritizes an overdue open call", () => {
    const action = getLeadNextAction(
      [
        { status: "IN_PROGRESS", time: "2026-08-18T14:00:00.000Z" },
        { status: "IN_PROGRESS", time: "2026-08-17T10:00:00.000Z" },
      ],
      { now: NOW },
    );

    expect(action).toMatchObject({ kind: "CALL", overdue: true });
  });

  it("makes a missing follow-up explicit", () => {
    expect(getLeadNextAction([], { now: NOW })).toEqual({
      kind: "MISSING",
      dueAt: null,
      overdue: false,
    });
  });

  it("uses the newest completed activity without treating a future call as history", () => {
    const activity = getLatestLeadActivity(
      {
        createdAt: "2026-08-01T12:00:00.000Z",
        callReminders: [
          { status: "IN_PROGRESS", time: "2026-08-19T12:00:00.000Z" },
          { status: "DONE", time: "2026-08-16T12:00:00.000Z" },
        ],
        updates: [{ title: "Client approved layout", updatedAt: "2026-08-17T12:00:00.000Z" }],
      },
      { now: NOW },
    );

    expect(activity).toMatchObject({
      kind: "UPDATE",
      label: "Client approved layout",
      at: "2026-08-17T12:00:00.000Z",
    });
  });

  it("calculates lead age and resolves the active contract stage", () => {
    expect(getLeadAgeDays("2026-08-08T12:00:00.000Z", { now: NOW })).toBe(10);
    expect(
      getCurrentContractStage({
        stages: [
          { title: "2D Study", stageStatus: "COMPLETED" },
          { title: "3D", stageStatus: "IN_PROGRESS" },
        ],
      }),
    ).toBe("3D");
  });
});

