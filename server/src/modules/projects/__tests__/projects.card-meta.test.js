// cardMeta is a PURE dto enrichment — no Prisma. It must be additive (never remove
// fields) and null-safe for undecorated/legacy-shaped records.
import { describe, it, expect } from "vitest";
import {
  computeProjectCardMeta,
  withProjectListCapabilities,
} from "../project/project.dto.js";

const NOW = new Date("2026-07-16T12:00:00.000Z");
const authUser = { id: 1, role: "ADMIN", permissions: [] };

const baseProject = {
  id: 10, type: "3D_Designer", status: "3D",
  statusChangedAt: new Date("2026-07-10T12:00:00.000Z"), // 6 days before NOW
  updatedAt: new Date("2026-07-15T12:00:00.000Z"),
  createdAt: new Date("2026-07-01T12:00:00.000Z"),
  deliveryTime: null,
  deliverySchedules: [],
  tasks: [],
  assignments: [],
};

describe("computeProjectCardMeta", () => {
  it("computes timeInStageDays from statusChangedAt", () => {
    expect(computeProjectCardMeta(baseProject, { now: NOW }).timeInStageDays).toBe(6);
  });

  it("falls back to updatedAt when statusChangedAt is null (pre-migration rows)", () => {
    const p = { ...baseProject, statusChangedAt: null };
    expect(computeProjectCardMeta(p, { now: NOW }).timeInStageDays).toBe(1);
  });

  it("nextAction prefers the upcoming delivery schedule", () => {
    const p = {
      ...baseProject,
      deliverySchedules: [{ deliveryAt: new Date("2026-07-18T12:00:00.000Z") }],
      tasks: [{ id: 1, title: "Render hall", status: "TODO", dueDate: null, updatedAt: baseProject.updatedAt }],
    };
    const meta = computeProjectCardMeta(p, { now: NOW });
    expect(meta.nextAction.kind).toBe("DELIVERY");
    expect(meta.nextAction.dueAt).toBe("2026-07-18T12:00:00.000Z");
  });

  it("nextAction falls back to the first open task", () => {
    const p = {
      ...baseProject,
      tasks: [{ id: 1, title: "Render hall", status: "TODO", dueDate: new Date("2026-07-20T12:00:00.000Z"), updatedAt: baseProject.updatedAt }],
    };
    const meta = computeProjectCardMeta(p, { now: NOW });
    expect(meta.nextAction).toEqual({ kind: "TASK", title: "Render hall", dueAt: "2026-07-20T12:00:00.000Z" });
  });

  it("nextAction is null when there is nothing actionable", () => {
    expect(computeProjectCardMeta(baseProject, { now: NOW }).nextAction).toBeNull();
  });

  it("overdue = deliveryTime past AND status not terminal", () => {
    const past = new Date("2026-07-10T00:00:00.000Z");
    expect(computeProjectCardMeta({ ...baseProject, deliveryTime: past }, { now: NOW }).overdue).toBe(true);
    expect(computeProjectCardMeta({ ...baseProject, deliveryTime: past, status: "Completed" }, { now: NOW }).overdue).toBe(false);
    expect(computeProjectCardMeta(baseProject, { now: NOW }).overdue).toBe(false);
  });

  it("latestActivityAt = max(project.updatedAt, first task.updatedAt)", () => {
    const p = {
      ...baseProject,
      tasks: [{ id: 1, title: "t", status: "TODO", dueDate: null, updatedAt: new Date("2026-07-16T09:00:00.000Z") }],
    };
    expect(computeProjectCardMeta(p, { now: NOW }).latestActivityAt).toBe("2026-07-16T09:00:00.000Z");
  });

  it("is null-safe on a record with none of the new fields", () => {
    const meta = computeProjectCardMeta({ id: 1, status: "To Do" }, { now: NOW });
    expect(meta).toEqual({ nextAction: null, overdue: false, timeInStageDays: null, latestActivityAt: null });
  });
});

describe("withProjectListCapabilities attaches cardMeta", () => {
  it("decorates nested board projects with BOTH capabilities and cardMeta", () => {
    const rows = [{ id: 5, client: { name: "Acme" }, projects: [baseProject] }];
    const out = withProjectListCapabilities(rows, authUser);
    expect(out[0].projects[0].capabilities).toBeTruthy();
    expect(out[0].projects[0].cardMeta).toBeTruthy();
    expect(out[0].projects[0].id).toBe(10); // additive, no field loss
  });
});
