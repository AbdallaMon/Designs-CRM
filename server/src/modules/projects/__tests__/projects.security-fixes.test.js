// Targeted security-fix tests for the PROJECTS domain (post security review):
//   FIX 1 — task DELETE is Task-only + always project-scoped (broad-delete IDOR).
//   FIX 2 — GET /user-profile/:userId is admin-tier-or-self scoped (PII enumeration).
//   FIX 3 — project/task update schemas are STRICT (mass-assignment).
// These complement projects.usecase.test.js (the scope keystone tests).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Project repo — keep the REAL `hasFullScope` (the admin-tier definition reused by the
// user-profile checker); the DB methods are unused here.
vi.mock("../project/project.repo.js", () => ({
  projectRepository: {
    hasFullScope({ role, currentProfileKey, isAdminTier }, mode) {
      if (currentProfileKey === "SUPER_SALES" || isAdminTier) return true;
      const roles = mode === "mutate" ? ["ADMIN", "SUPER_ADMIN"] : ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];
      return roles.includes(role);
    },
    findScopedProject: vi.fn(),
    findProjectStatus: vi.fn(),
  },
}));

vi.mock("../project/project.flows.js", () => ({
  legacyDefaults: {
    getLeadByPorjects: vi.fn(),
    getLeadByPorjectsColumn: vi.fn(),
    getLeadDetailsByProject: vi.fn(),
    getProjectsByClientLeadId: vi.fn(),
    getUserProjects: vi.fn(),
    getProjectDetailsById: vi.fn(),
    updateProject: vi.fn(),
    assignProjectToUser: vi.fn(),
    getUniqueProjectGroups: vi.fn(),
  },
  createGroupProjects: vi.fn(),
  assignProjectToUser: vi.fn(),
}));

// The shared project-scope seam that TaskUsecase.deleteTask delegates to.
vi.mock("../shared/project-scope.js", () => ({
  projectUsecase: {
    resolveTaskProject: vi.fn(),
    checkIfUserCanMutateProject: vi.fn(),
  },
}));

import { ProjectUsecase } from "../project/project.usecase.js";
import { TaskUsecase, legacyDefaults as taskLegacy } from "../task/task.usecase.js";
import { ProjectValidation } from "../project/project.validation.js";
import { TaskValidation } from "../task/task.validation.js";
import { projectUsecase as projectScope } from "../shared/project-scope.js";
import { projectsMessagesCodes } from "@dms/shared";


const admin = { id: 1, role: "ADMIN", permissions: [] };
const superSales = { id: 2, role: "STAFF", currentProfileKey: "SUPER_SALES", isAdminTier: true, permissions: [] };
const accountant = { id: 3, role: "ACCOUNTANT", permissions: [] };
const designer = { id: 4, role: "THREE_D_DESIGNER", permissions: [] };

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
//  FIX 1 — task DELETE: Task-only, ALWAYS project-scoped, no client cascade
// ════════════════════════════════════════════════════════════════════════════
describe("FIX 1 — TaskUsecase.deleteTask (broad-delete IDOR)", () => {
  it("ALWAYS enforces the project mutate scope before deleting a Task", async () => {
    projectScope.resolveTaskProject.mockResolvedValue({ id: 60, projectId: 10 });
    projectScope.checkIfUserCanMutateProject.mockResolvedValue({ id: 10 });
    vi.spyOn(taskLegacy, "deleteAModel").mockResolvedValue({ data: {} });
    const usecase = new TaskUsecase();
    await usecase.deleteTask({ id: 60, body: { model: "Task" }, authUser: designer });
    expect(projectScope.checkIfUserCanMutateProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
  });

  it("propagates 403 when the task's project is out of the caller's mutate scope", async () => {
    const denied = Object.assign(new Error(projectsMessagesCodes.PROJECT_MUTATE_DENIED), { statusCode: 403 });
    projectScope.resolveTaskProject.mockResolvedValue({ id: 61, projectId: 99 });
    projectScope.checkIfUserCanMutateProject.mockRejectedValue(denied);
    const deleteAModel = vi.spyOn(taskLegacy, "deleteAModel");
    const usecase = new TaskUsecase();
    await expect(
      usecase.deleteTask({ id: 61, body: { model: "Task" }, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_MUTATE_DENIED });
    expect(deleteAModel).not.toHaveBeenCalled(); // scope BEFORE delete
  });

  it("delegates with a SERVER-FIXED model:'Task' and NEVER forwards a client cascade", async () => {
    projectScope.resolveTaskProject.mockResolvedValue({ id: 62, projectId: 10 });
    projectScope.checkIfUserCanMutateProject.mockResolvedValue({ id: 10 });
    vi.spyOn(taskLegacy, "deleteAModel").mockResolvedValue({ data: {} });
    const usecase = new TaskUsecase();
    // a malicious body would carry a different model + a deleteModelesBeforeMain cascade;
    // the usecase must ignore both (validation also blocks them — see schema test below).
    await usecase.deleteTask({
      id: 62,
      body: { model: "Task", deleteModelesBeforeMain: [{ name: "Note", key: "taskId" }] },
      authUser: designer,
    });
    const arg = taskLegacy.deleteAModel.mock.calls[0][0];
    expect(arg.data).toEqual({ model: "Task" });
    expect(arg.data.deleteModelesBeforeMain).toBeUndefined();
  });

  it("validation: remove schema rejects model !== 'Task' (422) and strips extra keys", () => {
    expect(TaskValidation.remove.safeParse({ model: "User" }).success).toBe(false);
    expect(TaskValidation.remove.safeParse({ model: "Note" }).success).toBe(false);
    // deleteModelesBeforeMain (or any passthrough) is rejected by .strict()
    expect(
      TaskValidation.remove.safeParse({ model: "Task", deleteModelesBeforeMain: [] }).success,
    ).toBe(false);
    expect(TaskValidation.remove.safeParse({ model: "Task" }).success).toBe(true);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  FIX 2 — GET /user-profile/:userId scope (PII enumeration IDOR)
// ════════════════════════════════════════════════════════════════════════════
describe("FIX 2 — ProjectUsecase.checkIfUserCanAccessUserProfile", () => {
  it("admin-tier (ADMIN) may query ANY userId", async () => {
    const usecase = new ProjectUsecase();
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 999, authUser: admin }),
    ).resolves.toEqual({ userId: 999 });
  });

  it("admin-tier sub-roles (SUPER_SALES profile, ACCOUNTANT) may query ANY userId", async () => {
    const usecase = new ProjectUsecase();
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 999, authUser: superSales }),
    ).resolves.toEqual({ userId: 999 });
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 999, authUser: accountant }),
    ).resolves.toEqual({ userId: 999 });
  });

  it("a non-admin may query their OWN id", async () => {
    const usecase = new ProjectUsecase();
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 4, authUser: designer }),
    ).resolves.toEqual({ userId: 4 });
  });

  it("a non-admin querying ANOTHER user's id is DENIED (403)", async () => {
    const usecase = new ProjectUsecase();
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 7, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_ACCESS_DENIED });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  FIX 3 — strict update schemas (mass-assignment)
// ════════════════════════════════════════════════════════════════════════════
describe("FIX 3 — strict update schemas reject ownership/relation injection", () => {
  it("project updateProject: accepts the editable whitelist", () => {
    const r = ProjectValidation.updateProject.safeParse({
      status: "In Progress",
      priority: "HIGH",
      type: "3D_Designer",
    });
    expect(r.success).toBe(true);
  });

  // NOTE: `updateProject` uses `.strip()` (NOT `.strict()`) ON PURPOSE — the project-edit
  // form (ProjectDetails.jsx) submits the whole `{...project}` object, so `.strict()` would
  // 422 every edit and break master parity. The mass-assignment guarantee is still enforced:
  // the validate middleware forwards the STRIPPED `result.data`, so injected ownership/relation
  // keys are dropped before they can reach Prisma. These tests assert that stripping (they fail
  // if the schema is ever weakened to `.passthrough()`, which WOULD leak the injected keys).
  it("project updateProject: strips an injected id (never reaches Prisma)", () => {
    const r = ProjectValidation.updateProject.safeParse({ status: "x", id: 5 });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ status: "x" });
    expect(r.data).not.toHaveProperty("id");
  });

  it("project updateProject: strips injected clientLeadId / relations / userId", () => {
    const r = ProjectValidation.updateProject.safeParse({
      status: "x",
      clientLeadId: 9,
      assignments: [],
      userId: 3,
    });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ status: "x" });
    expect(r.data).not.toHaveProperty("clientLeadId");
    expect(r.data).not.toHaveProperty("assignments");
    expect(r.data).not.toHaveProperty("userId");
  });

  it("task updateTask: accepts the editable whitelist", () => {
    expect(TaskValidation.updateTask.safeParse({ status: "DONE", priority: "HIGH" }).success).toBe(true);
    expect(TaskValidation.updateTask.safeParse({ title: "t", description: "d", dueDate: null }).success).toBe(true);
  });

  it("task updateTask: rejects an injected id / clientLeadId / finishedAt", () => {
    expect(TaskValidation.updateTask.safeParse({ status: "DONE", id: 5 }).success).toBe(false);
    expect(TaskValidation.updateTask.safeParse({ clientLeadId: 9 }).success).toBe(false);
    expect(TaskValidation.updateTask.safeParse({ projectId: 9 }).success).toBe(false);
    expect(TaskValidation.updateTask.safeParse({ finishedAt: new Date() }).success).toBe(false);
  });
});
