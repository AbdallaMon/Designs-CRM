import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { projectsMessagesCodes } from "@dms/shared";


// ── module mocks (DI was removed; usecases call the imported singletons directly) ─────
// Project repo — keep the REAL scope-translation logic (`hasFullScope` /
// `buildAuthUserProjectWhere`, the IDOR keystone) so the tests exercise the actual
// where-building; the DB methods are vi.fn() stubs configured per test.
vi.mock("../project/project.repo.js", () => ({
  projectRepository: {
    hasFullScope({ currentProfileKey, isAdminTier }, mode) {
      if (currentProfileKey === "SUPER_SALES" || isAdminTier) return true;
      return mode === "view" && currentProfileKey === "ACCOUNTANT";
    },
    buildAuthUserProjectWhere({ authUser, where = {}, mode = "view" }) {
      if (this.hasFullScope(authUser, mode)) return { ...where };
      const ownership = { assignments: { some: { userId: Number(authUser.id) } } };
      const existingAnd = Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : [];
      return { ...where, AND: [...existingAnd, ownership] };
    },
    findScopedProject: vi.fn(),
    findProjectStatus: vi.fn(),
    findProjectClientLead: vi.fn(),
    findTaskParents: vi.fn(),
    findUpdateClientLead: vi.fn(),
    findSharedUpdateClientLead: vi.fn(),
    findDeliveryProject: vi.fn(),
    clientLeadHasAssignedProject: vi.fn(),
    findArchivedLeads: vi.fn(),
  },
}));

// Project flow bag — every legacy flow becomes a vi.fn(); the re-exported names
// (createGroupProjects / assignProjectToUser) must exist so the usecase's static
// `export { ... } from "./project.flows.js"` resolves.
vi.mock("../project/project.flows.js", () => ({
  projectOperations: {
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

// The shared project-scope seam that task/update/delivery delegate to. Mocking it lets
// those usecases' scope tests drive the parent-resolution + project-scope checkers.
vi.mock("../shared/project-scope.js", () => ({
  projectUsecase: {
    resolveTaskProject: vi.fn(),
    resolveUpdateClientLead: vi.fn(),
    resolveSharedUpdateClientLead: vi.fn(),
    resolveDeliveryProject: vi.fn(),
    checkIfUserCanAccessProject: vi.fn(),
    checkIfUserCanMutateProject: vi.fn(),
    checkIfUserCanAccessLeadProjects: vi.fn(),
  },
}));

import { ProjectUsecase } from "../project/project.usecase.js";
import { TaskUsecase, taskOperations } from "../task/task.usecase.js";
import { UpdateUsecase } from "../update/update.usecase.js";
import { DeliveryUsecase, deliveryOperations } from "../delivery/delivery.usecase.js";
import { projectRepository } from "../project/project.repo.js";
import { projectOperations } from "../project/project.flows.js";
import { projectUsecase as projectScope } from "../shared/project-scope.js";

// ── auth-user fixtures (shape carried on req.auth) ───────────────────────────────
const admin = { id: 1, currentProfileKey: "ADMIN", isAdminTier: true, permissions: [] };
const superSales = { id: 2, currentProfileKey: "SUPER_SALES", permissions: [] };
const accountant = { id: 3, currentProfileKey: "ACCOUNTANT", permissions: [] };
const designer = { id: 4, currentProfileKey: "DESIGNER_3D", permissions: [] };

beforeEach(() => {
  vi.resetAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
//  PROJECT SCOPE — the keystone IDOR fix (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase scope checkers (IDOR keystone)", () => {
  it("uses active SUPER_SALES as the project workflow supervisor signal", () => {
    expect(new ProjectUsecase().isAdminUser(superSales)).toBe(true);
    expect(new TaskUsecase().isAdminUser(superSales)).toBe(true);
    expect(new UpdateUsecase().isAdminUser(superSales)).toBe(true);
  });

  it("does not self-scope SUPER_SALES board, lead-project list, or project detail reads", async () => {
    projectOperations.getLeadByPorjects.mockResolvedValue([]);
    projectOperations.getProjectsByClientLeadId.mockResolvedValue([]);
    projectOperations.getProjectDetailsById.mockResolvedValue(null);
    const usecase = new ProjectUsecase();

    await usecase.getDesigners({ query: {}, authUser: superSales });
    await usecase.listByClientLead({ query: {}, authUser: superSales });
    await usecase.getProject({ id: 10, query: {}, authUser: superSales });

    expect(projectOperations.getLeadByPorjects.mock.calls[0][0]).toMatchObject({
      isAdmin: true,
      searchParams: { isAdmin: true, profileKey: "SUPER_SALES" },
    });
    expect(projectOperations.getProjectsByClientLeadId.mock.calls[0][0].searchParams.userId).toBeUndefined();
    expect(projectOperations.getProjectDetailsById.mock.calls[0][0].searchParams.userId).toBeUndefined();
  });

  it("ACCESS: a designer CAN access a project assigned to them", async () => {
    projectRepository.findScopedProject.mockResolvedValue({ id: 10, clientLeadId: 5, status: "To Do" });
    const usecase = new ProjectUsecase();
    const project = await usecase.checkIfUserCanAccessProject({ id: 10, authUser: designer });
    expect(project).toMatchObject({ id: 10 });
    // the where passed to the repo must carry the assignment narrowing for a designer.
    const where = projectRepository.findScopedProject.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({ assignments: { some: { userId: 4 } } });
  });

  it("ACCESS: a designer is DENIED a project they are NOT assigned to (403, core IDOR)", async () => {
    // repo returns null because the scoped where (assignment narrowing) matches nothing.
    projectRepository.findScopedProject.mockResolvedValue(null);
    const usecase = new ProjectUsecase();
    await expect(
      usecase.checkIfUserCanAccessProject({ id: 99, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_ACCESS_DENIED });
  });

  it("ACCESS: an admin sees ANY project (no assignment narrowing in the where)", async () => {
    projectRepository.findScopedProject.mockResolvedValue({ id: 7, clientLeadId: 1, status: "To Do" });
    const usecase = new ProjectUsecase();
    await usecase.checkIfUserCanAccessProject({ id: 7, authUser: admin });
    const where = projectRepository.findScopedProject.mock.calls[0][0].where;
    expect(where).toEqual({ id: 7 }); // no AND/assignment narrowing
  });

  it("ACCESS: SUPER_SALES active profile is full-scope (legacy isAdmin union)", async () => {
    projectRepository.findScopedProject.mockResolvedValue({ id: 8, clientLeadId: 1 });
    const usecase = new ProjectUsecase();
    await usecase.checkIfUserCanAccessProject({ id: 8, authUser: superSales });
    expect(projectRepository.findScopedProject.mock.calls[0][0].where).toEqual({ id: 8 });
  });

  it("MUTATE: ACCOUNTANT loses full scope (read-only carve-out) → assignment narrowed", async () => {
    projectRepository.findScopedProject.mockResolvedValue(null);
    const usecase = new ProjectUsecase();
    await expect(
      usecase.checkIfUserCanMutateProject({ id: 11, authUser: accountant }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_MUTATE_DENIED });
    const where = projectRepository.findScopedProject.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({ assignments: { some: { userId: 3 } } });
  });

  it("ACCESS (read): ACCOUNTANT keeps full READ scope (no narrowing)", async () => {
    projectRepository.findScopedProject.mockResolvedValue({ id: 12, clientLeadId: 1 });
    const usecase = new ProjectUsecase();
    await usecase.checkIfUserCanAccessProject({ id: 12, authUser: accountant });
    expect(projectRepository.findScopedProject.mock.calls[0][0].where).toEqual({ id: 12 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  CLIENT-LEAD-KEYED SCOPE (project list by lead, groups, updates)
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase.checkIfUserCanAccessLeadProjects", () => {
  it("admin passes without a DB probe", async () => {
    const usecase = new ProjectUsecase();
    const out = await usecase.checkIfUserCanAccessLeadProjects({ clientLeadId: 5, authUser: admin });
    expect(out).toEqual({ clientLeadId: 5 });
    expect(projectRepository.clientLeadHasAssignedProject).not.toHaveBeenCalled();
  });

  it("a designer with an assigned project on the lead is ALLOWED", async () => {
    projectRepository.clientLeadHasAssignedProject.mockResolvedValue(true);
    const usecase = new ProjectUsecase();
    const out = await usecase.checkIfUserCanAccessLeadProjects({ clientLeadId: 5, authUser: designer });
    expect(out).toEqual({ clientLeadId: 5 });
  });

  it("a designer with NO assigned project on the lead is DENIED (403)", async () => {
    projectRepository.clientLeadHasAssignedProject.mockResolvedValue(false);
    const usecase = new ProjectUsecase();
    await expect(
      usecase.checkIfUserCanAccessLeadProjects({ clientLeadId: 5, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_ACCESS_DENIED });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  WORKFLOW ACTION — change designer status (oldStatus is server-derived)
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase.changeDesignerStatus (workflow action)", () => {
  it("overrides any client-supplied oldStatus with the server status (guard-bypass fix)", async () => {
    projectRepository.findProjectStatus.mockResolvedValue({ status: "In Progress" });
    projectOperations.updateProject.mockResolvedValue({ id: 20 });
    const usecase = new ProjectUsecase();
    await usecase.changeDesignerStatus({
      body: { id: 20, status: "Completed", oldStatus: "To Do" }, // forged oldStatus
      authUser: designer,
      currentStatus: "In Progress", // from the scope checker (req.scoped)
    });
    const data = projectOperations.updateProject.mock.calls[0][0].data;
    expect(data.oldStatus).toBe("In Progress"); // server value, NOT the forged "To Do"
    expect(data.isAdmin).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  DESIGNER-LEAD PER-TAB SLICES — reuse the scoped detail, return one slice
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase designer-lead sub-resource readers", () => {
  it("returns ONLY the requested slice of the scoped detail", async () => {
    projectOperations.getLeadDetailsByProject.mockResolvedValue({
      id: 5,
      files: [{ id: 1 }, { id: 2 }],
      notes: [{ id: 9 }],
      callReminders: [{ id: 7 }],
      projects: [],
    });
    const usecase = new ProjectUsecase();

    expect(await usecase.getDesignerLeadFiles({ id: 5, query: { type: "two-d" }, authUser: designer }))
      .toEqual([{ id: 1 }, { id: 2 }]);
    expect(await usecase.getDesignerLeadNotes({ id: 5, query: { type: "two-d" }, authUser: designer }))
      .toEqual([{ id: 9 }]);
    expect(await usecase.getDesignerLeadCalls({ id: 5, query: { type: "two-d" }, authUser: designer }))
      .toEqual([{ id: 7 }]);
  });

  it("forwards the per-user narrowing (designer → searchParams.userId = self)", async () => {
    projectOperations.getLeadDetailsByProject.mockResolvedValue({ id: 5, files: [] });
    const usecase = new ProjectUsecase();
    await usecase.getDesignerLeadFiles({ id: 5, query: { type: "two-d" }, authUser: designer });
    // getDesignerLeadDetail narrows a non-admin/non-accountant caller to their own id,
    // so the slice can never expose more than the full scoped detail already does.
    const searchParams = projectOperations.getLeadDetailsByProject.mock.calls[0][1];
    expect(searchParams.userId).toBe(designer.id);
  });

  it("returns [] (never a non-array) when the scoped detail is empty", async () => {
    projectOperations.getLeadDetailsByProject.mockResolvedValue(null);
    const usecase = new ProjectUsecase();
    expect(await usecase.getDesignerLeadFiles({ id: 5, query: {}, authUser: designer })).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ARCHIVED LIST — pagination envelope shape
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase.listArchivedProjects pagination shape", () => {
  it("returns { items, total } from the repo (controller wraps to {items,total,page,pageSize})", async () => {
    projectRepository.findArchivedLeads.mockResolvedValue({ items: [{ id: 1, projects: [] }], total: 1 });
    const usecase = new ProjectUsecase();
    const out = await usecase.listArchivedProjects({
      query: { filters: JSON.stringify({}) },
      authUser: designer,
      skip: 0,
      limit: 10,
    });
    expect(out).toMatchObject({ total: 1 });
    expect(Array.isArray(out.items)).toBe(true);
    // a non-admin archived query must carry the assignment narrowing.
    const where = projectRepository.findArchivedLeads.mock.calls[0][0].where;
    expect(where.projects.some.assignments).toEqual({ some: { userId: 4 } });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  TASK SCOPE — parent-project resolution (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("TaskUsecase scope via parent project", () => {
  it("ACCESS: resolves the task's project then DELEGATES to the project access checker", async () => {
    projectScope.resolveTaskProject.mockResolvedValue({ id: 30, projectId: 10, clientLeadId: 5 });
    projectScope.checkIfUserCanAccessProject.mockResolvedValue({ id: 10 });
    const usecase = new TaskUsecase();
    await usecase.checkIfUserCanAccessTask({ taskId: 30, authUser: designer });
    expect(projectScope.checkIfUserCanAccessProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
  });

  it("ACCESS: a task whose project is NOT accessible propagates the 403 (IDOR)", async () => {
    const denied = Object.assign(new Error(projectsMessagesCodes.PROJECT_ACCESS_DENIED), { statusCode: 403 });
    projectScope.resolveTaskProject.mockResolvedValue({ id: 31, projectId: 99, clientLeadId: 5 });
    projectScope.checkIfUserCanAccessProject.mockRejectedValue(denied);
    const usecase = new TaskUsecase();
    await expect(
      usecase.checkIfUserCanAccessTask({ taskId: 31, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_ACCESS_DENIED });
  });

  it("DELETE: generic delete with model=Task runs the project MUTATE scope", async () => {
    projectScope.resolveTaskProject.mockResolvedValue({ id: 32, projectId: 10 });
    projectScope.checkIfUserCanMutateProject.mockResolvedValue({ id: 10 });
    vi.spyOn(taskOperations, "deleteAllowedModel").mockResolvedValue({ data: {} });
    const usecase = new TaskUsecase();
    await usecase.deleteTask({ id: 32, body: { model: "Task" }, authUser: designer });
    expect(projectScope.checkIfUserCanMutateProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
    expect(taskOperations.deleteAllowedModel).toHaveBeenCalled();
  });

  it("DELETE: missing body.model → 400 DELETE_MODEL_REQUIRED", async () => {
    const usecase = new TaskUsecase();
    await expect(
      usecase.deleteTask({ id: 1, body: {}, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 400, message: projectsMessagesCodes.DELETE_MODEL_REQUIRED });
  });

  // ── dueDate coercion (Prisma DateTime? rejects a bare "2026-06-12" string) ──────
  it("CREATE: coerces a date-only dueDate string to a real Date before the repo", async () => {
    vi.spyOn(taskOperations, "createNewTask").mockResolvedValue({ id: 60, type: "NORMAL" });
    const usecase = new TaskUsecase();
    await usecase.createTask({ body: { title: "t", dueDate: "2026-06-12" }, authUser: designer });
    const data = taskOperations.createNewTask.mock.calls[0][0].data;
    expect(data.dueDate).toBeInstanceOf(Date);
    expect(data.dueDate.toISOString()).toBe("2026-06-12T00:00:00.000Z");
  });

  it("CREATE: a null/absent dueDate stays null (never new Date(\"\") → Invalid Date)", async () => {
    vi.spyOn(taskOperations, "createNewTask").mockResolvedValue({ id: 61, type: "NORMAL" });
    const usecase = new TaskUsecase();
    await usecase.createTask({ body: { title: "t", dueDate: null }, authUser: designer });
    expect(taskOperations.createNewTask.mock.calls[0][0].data.dueDate).toBeNull();

    await usecase.createTask({ body: { title: "t", dueDate: "" }, authUser: designer });
    expect(taskOperations.createNewTask.mock.calls[1][0].data.dueDate).toBeNull();
  });

  it("UPDATE: coerces a date-only dueDate string the same way", async () => {
    vi.spyOn(taskOperations, "updateTask").mockResolvedValue({ id: 62, type: "NORMAL" });
    const usecase = new TaskUsecase();
    await usecase.updateTask({ taskId: 62, body: { dueDate: "2026-06-12" }, authUser: designer });
    const data = taskOperations.updateTask.mock.calls[0][0].data;
    expect(data.dueDate).toBeInstanceOf(Date);
    expect(data.dueDate.toISOString()).toBe("2026-06-12T00:00:00.000Z");
  });

  it("UPDATE: a body without dueDate is left untouched (no spurious null injected)", async () => {
    vi.spyOn(taskOperations, "updateTask").mockResolvedValue({ id: 63, type: "NORMAL" });
    const usecase = new TaskUsecase();
    await usecase.updateTask({ taskId: 63, body: { status: "DONE" }, authUser: designer });
    const data = taskOperations.updateTask.mock.calls[0][0].data;
    expect("dueDate" in data).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  UPDATE SCOPE — parent clientLead resolution (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("UpdateUsecase scope via parent clientLead", () => {
  it("ACCESS by updateId: resolves the update's lead then runs the lead scope", async () => {
    projectScope.resolveUpdateClientLead.mockResolvedValue({ id: 40, clientLeadId: 5 });
    projectScope.checkIfUserCanAccessLeadProjects.mockResolvedValue({ clientLeadId: 5 });
    const usecase = new UpdateUsecase();
    const out = await usecase.checkIfUserCanAccessUpdateById({ updateId: 40, authUser: designer });
    expect(out).toMatchObject({ updateId: 40, clientLeadId: 5 });
    expect(projectScope.checkIfUserCanAccessLeadProjects).toHaveBeenCalledWith({ clientLeadId: 5, authUser: designer });
  });

  it("ACCESS by sharedUpdateId: denied when the parent lead is out of scope (403)", async () => {
    const denied = Object.assign(new Error(projectsMessagesCodes.PROJECT_ACCESS_DENIED), { statusCode: 403 });
    projectScope.resolveSharedUpdateClientLead.mockResolvedValue({ id: 41, clientLeadId: 9 });
    projectScope.checkIfUserCanAccessLeadProjects.mockRejectedValue(denied);
    const usecase = new UpdateUsecase();
    await expect(
      usecase.checkIfUserCanAccessSharedUpdate({ sharedUpdateId: 41, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_ACCESS_DENIED });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  DELIVERY SCOPE — parent project resolution (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("DeliveryUsecase scope via parent project", () => {
  it("MUTATE: resolves the delivery's project then runs the project mutate scope", async () => {
    projectScope.resolveDeliveryProject.mockResolvedValue({ id: 50, projectId: 10 });
    projectScope.checkIfUserCanMutateProject.mockResolvedValue({ id: 10 });
    const usecase = new DeliveryUsecase();
    const out = await usecase.checkIfUserCanMutateDelivery({ deliveryId: 50, authUser: designer });
    expect(out).toMatchObject({ deliveryId: 50, projectId: 10 });
    expect(projectScope.checkIfUserCanMutateProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
  });

  it("MUTATE: denied when the delivery's project is out of scope (403, IDOR)", async () => {
    const denied = Object.assign(new Error(projectsMessagesCodes.PROJECT_MUTATE_DENIED), { statusCode: 403 });
    projectScope.resolveDeliveryProject.mockResolvedValue({ id: 51, projectId: 99 });
    projectScope.checkIfUserCanMutateProject.mockRejectedValue(denied);
    const usecase = new DeliveryUsecase();
    await expect(
      usecase.checkIfUserCanMutateDelivery({ deliveryId: 51, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: projectsMessagesCodes.PROJECT_MUTATE_DENIED });
  });

  it("DELETE calls the legacy service with the correct `id` (legacy {deliveryId} bug fixed)", async () => {
    vi.spyOn(deliveryOperations, "deleteDeliverySchedule").mockResolvedValue({ id: 52 });
    const usecase = new DeliveryUsecase();
    await usecase.deleteDeliverySchedule({ deliveryId: 52 });
    expect(deliveryOperations.deleteDeliverySchedule).toHaveBeenCalledWith({ id: 52 });
  });
});
