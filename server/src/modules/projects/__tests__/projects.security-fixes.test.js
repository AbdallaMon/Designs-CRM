// Targeted security-fix tests for the PROJECTS domain (post security review):
//   FIX 1 — task DELETE is Task-only + always project-scoped (broad-delete IDOR).
//   FIX 2 — GET /user-profile/:userId is admin-tier-or-self scoped (PII enumeration).
//   FIX 3 — project/task update schemas are STRICT (mass-assignment).
// These complement projects.usecase.test.js (the scope keystone tests).
import { describe, it, expect, vi } from "vitest";

import { ProjectUsecase } from "../project/project.usecase.js";
import { TaskUsecase } from "../task/task.usecase.js";
import { ProjectValidation } from "../project/project.validation.js";
import { TaskValidation } from "../task/task.validation.js";
import { projectsMessagesCodes } from "@dms/shared";

const C = projectsMessagesCodes;

const admin = { id: 1, role: "ADMIN", permissions: [] };
const superSales = { id: 2, role: "STAFF", isSuperSales: true, permissions: [] };
const accountant = { id: 3, role: "ACCOUNTANT", permissions: [] };
const designer = { id: 4, role: "THREE_D_DESIGNER", permissions: [] };

// Real hasFullScope (the admin-tier definition reused by the user-profile checker).
function makeProjectRepo(overrides = {}) {
  return {
    hasFullScope({ role, isSuperSales }, mode) {
      if (isSuperSales) return true;
      const roles = mode === "mutate" ? ["ADMIN", "SUPER_ADMIN"] : ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];
      return roles.includes(role);
    },
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  FIX 1 — task DELETE: Task-only, ALWAYS project-scoped, no client cascade
// ════════════════════════════════════════════════════════════════════════════
describe("FIX 1 — TaskUsecase.remove (broad-delete IDOR)", () => {
  function makeProjects(overrides = {}) {
    return {
      resolveTaskProject: vi.fn(),
      checkIfUserCanMutateProject: vi.fn(),
      ...overrides,
    };
  }

  it("ALWAYS enforces the project mutate scope before deleting a Task", async () => {
    const projects = makeProjects({
      resolveTaskProject: vi.fn().mockResolvedValue({ id: 60, projectId: 10 }),
      checkIfUserCanMutateProject: vi.fn().mockResolvedValue({ id: 10 }),
    });
    const legacy = { deleteAModel: vi.fn().mockResolvedValue({ data: {} }) };
    const usecase = new TaskUsecase({}, projects, legacy);
    await usecase.remove({ id: 60, body: { model: "Task" }, authUser: designer });
    expect(projects.checkIfUserCanMutateProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
  });

  it("propagates 403 when the task's project is out of the caller's mutate scope", async () => {
    const denied = Object.assign(new Error(C.PROJECT_MUTATE_DENIED), { statusCode: 403 });
    const projects = makeProjects({
      resolveTaskProject: vi.fn().mockResolvedValue({ id: 61, projectId: 99 }),
      checkIfUserCanMutateProject: vi.fn().mockRejectedValue(denied),
    });
    const legacy = { deleteAModel: vi.fn() };
    const usecase = new TaskUsecase({}, projects, legacy);
    await expect(
      usecase.remove({ id: 61, body: { model: "Task" }, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_MUTATE_DENIED });
    expect(legacy.deleteAModel).not.toHaveBeenCalled(); // scope BEFORE delete
  });

  it("delegates with a SERVER-FIXED model:'Task' and NEVER forwards a client cascade", async () => {
    const projects = makeProjects({
      resolveTaskProject: vi.fn().mockResolvedValue({ id: 62, projectId: 10 }),
      checkIfUserCanMutateProject: vi.fn().mockResolvedValue({ id: 10 }),
    });
    const legacy = { deleteAModel: vi.fn().mockResolvedValue({ data: {} }) };
    const usecase = new TaskUsecase({}, projects, legacy);
    // a malicious body would carry a different model + a deleteModelesBeforeMain cascade;
    // the usecase must ignore both (validation also blocks them — see schema test below).
    await usecase.remove({
      id: 62,
      body: { model: "Task", deleteModelesBeforeMain: [{ name: "Note", key: "taskId" }] },
      authUser: designer,
    });
    const arg = legacy.deleteAModel.mock.calls[0][0];
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
    const usecase = new ProjectUsecase(makeProjectRepo());
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 999, authUser: admin }),
    ).resolves.toEqual({ userId: 999 });
  });

  it("admin-tier sub-roles (isSuperSales, ACCOUNTANT) may query ANY userId", async () => {
    const usecase = new ProjectUsecase(makeProjectRepo());
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 999, authUser: superSales }),
    ).resolves.toEqual({ userId: 999 });
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 999, authUser: accountant }),
    ).resolves.toEqual({ userId: 999 });
  });

  it("a non-admin may query their OWN id", async () => {
    const usecase = new ProjectUsecase(makeProjectRepo());
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 4, authUser: designer }),
    ).resolves.toEqual({ userId: 4 });
  });

  it("a non-admin querying ANOTHER user's id is DENIED (403)", async () => {
    const usecase = new ProjectUsecase(makeProjectRepo());
    await expect(
      usecase.checkIfUserCanAccessUserProfile({ userId: 7, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_ACCESS_DENIED });
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

  it("project updateProject: rejects an injected id", () => {
    expect(ProjectValidation.updateProject.safeParse({ status: "x", id: 5 }).success).toBe(false);
  });

  it("project updateProject: rejects an injected clientLeadId / relation", () => {
    expect(ProjectValidation.updateProject.safeParse({ clientLeadId: 9 }).success).toBe(false);
    expect(ProjectValidation.updateProject.safeParse({ assignments: [] }).success).toBe(false);
    expect(ProjectValidation.updateProject.safeParse({ userId: 3 }).success).toBe(false);
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
