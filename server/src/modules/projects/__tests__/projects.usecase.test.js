import { describe, it, expect, vi } from "vitest";

import { ProjectUsecase } from "../project/project.usecase.js";
import { TaskUsecase } from "../task/task.usecase.js";
import { UpdateUsecase } from "../update/update.usecase.js";
import { DeliveryUsecase } from "../delivery/delivery.usecase.js";
import { projectsMessagesCodes } from "@dms/shared";

const C = projectsMessagesCodes;

// ── auth-user fixtures (shape carried on req.auth) ───────────────────────────────
const admin = { id: 1, role: "ADMIN", permissions: [] };
const superSales = { id: 2, role: "STAFF", isSuperSales: true, permissions: [] };
const accountant = { id: 3, role: "ACCOUNTANT", permissions: [] };
const designer = { id: 4, role: "THREE_D_DESIGNER", permissions: [] };

/** Minimal fake project repository — only the methods the tested usecases touch.
 *  `buildAuthUserProjectWhere` + `hasFullScope` keep their REAL logic (the IDOR
 *  keystone) so the tests exercise the actual scope translation. */
function makeProjectRepo(overrides = {}) {
  const real = {
    hasFullScope({ role, isSuperSales }, mode) {
      if (isSuperSales) return true;
      const roles = mode === "mutate" ? ["ADMIN", "SUPER_ADMIN"] : ["ADMIN", "SUPER_ADMIN", "ACCOUNTANT"];
      return roles.includes(role);
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
  };
  return { ...real, ...overrides };
}

// ════════════════════════════════════════════════════════════════════════════
//  PROJECT SCOPE — the keystone IDOR fix (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase scope checkers (IDOR keystone)", () => {
  it("ACCESS: a designer CAN access a project assigned to them", async () => {
    const repo = makeProjectRepo({
      findScopedProject: vi.fn().mockResolvedValue({ id: 10, clientLeadId: 5, status: "To Do" }),
    });
    const usecase = new ProjectUsecase(repo);
    const project = await usecase.checkIfUserCanAccessProject({ id: 10, authUser: designer });
    expect(project).toMatchObject({ id: 10 });
    // the where passed to the repo must carry the assignment narrowing for a designer.
    const where = repo.findScopedProject.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({ assignments: { some: { userId: 4 } } });
  });

  it("ACCESS: a designer is DENIED a project they are NOT assigned to (403, core IDOR)", async () => {
    // repo returns null because the scoped where (assignment narrowing) matches nothing.
    const repo = makeProjectRepo({ findScopedProject: vi.fn().mockResolvedValue(null) });
    const usecase = new ProjectUsecase(repo);
    await expect(
      usecase.checkIfUserCanAccessProject({ id: 99, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_ACCESS_DENIED });
  });

  it("ACCESS: an admin sees ANY project (no assignment narrowing in the where)", async () => {
    const repo = makeProjectRepo({
      findScopedProject: vi.fn().mockResolvedValue({ id: 7, clientLeadId: 1, status: "To Do" }),
    });
    const usecase = new ProjectUsecase(repo);
    await usecase.checkIfUserCanAccessProject({ id: 7, authUser: admin });
    const where = repo.findScopedProject.mock.calls[0][0].where;
    expect(where).toEqual({ id: 7 }); // no AND/assignment narrowing
  });

  it("ACCESS: isSuperSales is full-scope (legacy isAdmin union)", async () => {
    const repo = makeProjectRepo({
      findScopedProject: vi.fn().mockResolvedValue({ id: 8, clientLeadId: 1 }),
    });
    const usecase = new ProjectUsecase(repo);
    await usecase.checkIfUserCanAccessProject({ id: 8, authUser: superSales });
    expect(repo.findScopedProject.mock.calls[0][0].where).toEqual({ id: 8 });
  });

  it("MUTATE: ACCOUNTANT loses full scope (read-only carve-out) → assignment narrowed", async () => {
    const repo = makeProjectRepo({ findScopedProject: vi.fn().mockResolvedValue(null) });
    const usecase = new ProjectUsecase(repo);
    await expect(
      usecase.checkIfUserCanMutateProject({ id: 11, authUser: accountant }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_MUTATE_DENIED });
    const where = repo.findScopedProject.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({ assignments: { some: { userId: 3 } } });
  });

  it("ACCESS (read): ACCOUNTANT keeps full READ scope (no narrowing)", async () => {
    const repo = makeProjectRepo({
      findScopedProject: vi.fn().mockResolvedValue({ id: 12, clientLeadId: 1 }),
    });
    const usecase = new ProjectUsecase(repo);
    await usecase.checkIfUserCanAccessProject({ id: 12, authUser: accountant });
    expect(repo.findScopedProject.mock.calls[0][0].where).toEqual({ id: 12 });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  CLIENT-LEAD-KEYED SCOPE (project list by lead, groups, updates)
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase.checkIfUserCanAccessLeadProjects", () => {
  it("admin passes without a DB probe", async () => {
    const repo = makeProjectRepo();
    const usecase = new ProjectUsecase(repo);
    const out = await usecase.checkIfUserCanAccessLeadProjects({ clientLeadId: 5, authUser: admin });
    expect(out).toEqual({ clientLeadId: 5 });
    expect(repo.clientLeadHasAssignedProject).not.toHaveBeenCalled();
  });

  it("a designer with an assigned project on the lead is ALLOWED", async () => {
    const repo = makeProjectRepo({ clientLeadHasAssignedProject: vi.fn().mockResolvedValue(true) });
    const usecase = new ProjectUsecase(repo);
    const out = await usecase.checkIfUserCanAccessLeadProjects({ clientLeadId: 5, authUser: designer });
    expect(out).toEqual({ clientLeadId: 5 });
  });

  it("a designer with NO assigned project on the lead is DENIED (403)", async () => {
    const repo = makeProjectRepo({ clientLeadHasAssignedProject: vi.fn().mockResolvedValue(false) });
    const usecase = new ProjectUsecase(repo);
    await expect(
      usecase.checkIfUserCanAccessLeadProjects({ clientLeadId: 5, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_ACCESS_DENIED });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  WORKFLOW ACTION — change designer status (oldStatus is server-derived)
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase.changeDesignerStatus (workflow action)", () => {
  it("overrides any client-supplied oldStatus with the server status (guard-bypass fix)", async () => {
    const repo = makeProjectRepo({ findProjectStatus: vi.fn().mockResolvedValue({ status: "In Progress" }) });
    const legacy = { updateProject: vi.fn().mockResolvedValue({ id: 20 }) };
    const usecase = new ProjectUsecase(repo, legacy);
    await usecase.changeDesignerStatus({
      body: { id: 20, status: "Completed", oldStatus: "To Do" }, // forged oldStatus
      authUser: designer,
      currentStatus: "In Progress", // from the scope checker (req.scoped)
    });
    const data = legacy.updateProject.mock.calls[0][0].data;
    expect(data.oldStatus).toBe("In Progress"); // server value, NOT the forged "To Do"
    expect(data.isAdmin).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  ARCHIVED LIST — pagination envelope shape
// ════════════════════════════════════════════════════════════════════════════
describe("ProjectUsecase.archived pagination shape", () => {
  it("returns { items, total } from the repo (controller wraps to {items,total,page,pageSize})", async () => {
    const repo = makeProjectRepo({
      findArchivedLeads: vi.fn().mockResolvedValue({ items: [{ id: 1, projects: [] }], total: 1 }),
    });
    const usecase = new ProjectUsecase(repo);
    const out = await usecase.archived({
      query: { filters: JSON.stringify({}) },
      authUser: designer,
      skip: 0,
      limit: 10,
    });
    expect(out).toMatchObject({ total: 1 });
    expect(Array.isArray(out.items)).toBe(true);
    // a non-admin archived query must carry the assignment narrowing.
    const where = repo.findArchivedLeads.mock.calls[0][0].where;
    expect(where.projects.some.assignments).toEqual({ some: { userId: 4 } });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  TASK SCOPE — parent-project resolution (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("TaskUsecase scope via parent project", () => {
  function makeProjects(overrides = {}) {
    return {
      resolveTaskProject: vi.fn(),
      checkIfUserCanAccessProject: vi.fn(),
      checkIfUserCanMutateProject: vi.fn(),
      ...overrides,
    };
  }

  it("ACCESS: resolves the task's project then DELEGATES to the project access checker", async () => {
    const projects = makeProjects({
      resolveTaskProject: vi.fn().mockResolvedValue({ id: 30, projectId: 10, clientLeadId: 5 }),
      checkIfUserCanAccessProject: vi.fn().mockResolvedValue({ id: 10 }),
    });
    const usecase = new TaskUsecase({}, projects);
    await usecase.checkIfUserCanAccessTask({ taskId: 30, authUser: designer });
    expect(projects.checkIfUserCanAccessProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
  });

  it("ACCESS: a task whose project is NOT accessible propagates the 403 (IDOR)", async () => {
    const denied = Object.assign(new Error(C.PROJECT_ACCESS_DENIED), { statusCode: 403 });
    const projects = makeProjects({
      resolveTaskProject: vi.fn().mockResolvedValue({ id: 31, projectId: 99, clientLeadId: 5 }),
      checkIfUserCanAccessProject: vi.fn().mockRejectedValue(denied),
    });
    const usecase = new TaskUsecase({}, projects);
    await expect(
      usecase.checkIfUserCanAccessTask({ taskId: 31, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_ACCESS_DENIED });
  });

  it("DELETE: generic delete with model=Task runs the project MUTATE scope", async () => {
    const projects = makeProjects({
      resolveTaskProject: vi.fn().mockResolvedValue({ id: 32, projectId: 10 }),
      checkIfUserCanMutateProject: vi.fn().mockResolvedValue({ id: 10 }),
    });
    const legacy = { deleteAModel: vi.fn().mockResolvedValue({ data: {} }) };
    const usecase = new TaskUsecase({}, projects, legacy);
    await usecase.remove({ id: 32, body: { model: "Task" }, authUser: designer });
    expect(projects.checkIfUserCanMutateProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
    expect(legacy.deleteAModel).toHaveBeenCalled();
  });

  it("DELETE: missing body.model → 400 DELETE_MODEL_REQUIRED", async () => {
    const usecase = new TaskUsecase({}, makeProjects(), { deleteAModel: vi.fn() });
    await expect(
      usecase.remove({ id: 1, body: {}, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 400, message: C.DELETE_MODEL_REQUIRED });
  });

  // ── dueDate coercion (Prisma DateTime? rejects a bare "2026-06-12" string) ──────
  it("CREATE: coerces a date-only dueDate string to a real Date before the repo", async () => {
    const legacy = { createNewTask: vi.fn().mockResolvedValue({ id: 60, type: "NORMAL" }) };
    const usecase = new TaskUsecase({}, makeProjects(), legacy);
    await usecase.create({ body: { title: "t", dueDate: "2026-06-12" }, authUser: designer });
    const data = legacy.createNewTask.mock.calls[0][0].data;
    expect(data.dueDate).toBeInstanceOf(Date);
    expect(data.dueDate.toISOString()).toBe("2026-06-12T00:00:00.000Z");
  });

  it("CREATE: a null/absent dueDate stays null (never new Date(\"\") → Invalid Date)", async () => {
    const legacy = { createNewTask: vi.fn().mockResolvedValue({ id: 61, type: "NORMAL" }) };
    const usecase = new TaskUsecase({}, makeProjects(), legacy);
    await usecase.create({ body: { title: "t", dueDate: null }, authUser: designer });
    expect(legacy.createNewTask.mock.calls[0][0].data.dueDate).toBeNull();

    await usecase.create({ body: { title: "t", dueDate: "" }, authUser: designer });
    expect(legacy.createNewTask.mock.calls[1][0].data.dueDate).toBeNull();
  });

  it("UPDATE: coerces a date-only dueDate string the same way", async () => {
    const projects = makeProjects();
    const legacy = { updateTask: vi.fn().mockResolvedValue({ id: 62, type: "NORMAL" }) };
    const usecase = new TaskUsecase({}, projects, legacy);
    await usecase.update({ taskId: 62, body: { dueDate: "2026-06-12" }, authUser: designer });
    const data = legacy.updateTask.mock.calls[0][0].data;
    expect(data.dueDate).toBeInstanceOf(Date);
    expect(data.dueDate.toISOString()).toBe("2026-06-12T00:00:00.000Z");
  });

  it("UPDATE: a body without dueDate is left untouched (no spurious null injected)", async () => {
    const legacy = { updateTask: vi.fn().mockResolvedValue({ id: 63, type: "NORMAL" }) };
    const usecase = new TaskUsecase({}, makeProjects(), legacy);
    await usecase.update({ taskId: 63, body: { status: "DONE" }, authUser: designer });
    const data = legacy.updateTask.mock.calls[0][0].data;
    expect("dueDate" in data).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  UPDATE SCOPE — parent clientLead resolution (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("UpdateUsecase scope via parent clientLead", () => {
  function makeProjects(overrides = {}) {
    return {
      resolveUpdateClientLead: vi.fn(),
      resolveSharedUpdateClientLead: vi.fn(),
      checkIfUserCanAccessLeadProjects: vi.fn(),
      ...overrides,
    };
  }

  it("ACCESS by updateId: resolves the update's lead then runs the lead scope", async () => {
    const projects = makeProjects({
      resolveUpdateClientLead: vi.fn().mockResolvedValue({ id: 40, clientLeadId: 5 }),
      checkIfUserCanAccessLeadProjects: vi.fn().mockResolvedValue({ clientLeadId: 5 }),
    });
    const usecase = new UpdateUsecase({}, projects);
    const out = await usecase.checkIfUserCanAccessUpdateById({ updateId: 40, authUser: designer });
    expect(out).toMatchObject({ updateId: 40, clientLeadId: 5 });
    expect(projects.checkIfUserCanAccessLeadProjects).toHaveBeenCalledWith({ clientLeadId: 5, authUser: designer });
  });

  it("ACCESS by sharedUpdateId: denied when the parent lead is out of scope (403)", async () => {
    const denied = Object.assign(new Error(C.PROJECT_ACCESS_DENIED), { statusCode: 403 });
    const projects = makeProjects({
      resolveSharedUpdateClientLead: vi.fn().mockResolvedValue({ id: 41, clientLeadId: 9 }),
      checkIfUserCanAccessLeadProjects: vi.fn().mockRejectedValue(denied),
    });
    const usecase = new UpdateUsecase({}, projects);
    await expect(
      usecase.checkIfUserCanAccessSharedUpdate({ sharedUpdateId: 41, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_ACCESS_DENIED });
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  DELIVERY SCOPE — parent project resolution (allow vs deny)
// ════════════════════════════════════════════════════════════════════════════
describe("DeliveryUsecase scope via parent project", () => {
  function makeProjects(overrides = {}) {
    return {
      resolveDeliveryProject: vi.fn(),
      checkIfUserCanAccessProject: vi.fn(),
      checkIfUserCanMutateProject: vi.fn(),
      ...overrides,
    };
  }

  it("MUTATE: resolves the delivery's project then runs the project mutate scope", async () => {
    const projects = makeProjects({
      resolveDeliveryProject: vi.fn().mockResolvedValue({ id: 50, projectId: 10 }),
      checkIfUserCanMutateProject: vi.fn().mockResolvedValue({ id: 10 }),
    });
    const usecase = new DeliveryUsecase({}, projects);
    const out = await usecase.checkIfUserCanMutateDelivery({ deliveryId: 50, authUser: designer });
    expect(out).toMatchObject({ deliveryId: 50, projectId: 10 });
    expect(projects.checkIfUserCanMutateProject).toHaveBeenCalledWith({ id: 10, authUser: designer });
  });

  it("MUTATE: denied when the delivery's project is out of scope (403, IDOR)", async () => {
    const denied = Object.assign(new Error(C.PROJECT_MUTATE_DENIED), { statusCode: 403 });
    const projects = makeProjects({
      resolveDeliveryProject: vi.fn().mockResolvedValue({ id: 51, projectId: 99 }),
      checkIfUserCanMutateProject: vi.fn().mockRejectedValue(denied),
    });
    const usecase = new DeliveryUsecase({}, projects);
    await expect(
      usecase.checkIfUserCanMutateDelivery({ deliveryId: 51, authUser: designer }),
    ).rejects.toMatchObject({ statusCode: 403, message: C.PROJECT_MUTATE_DENIED });
  });

  it("DELETE calls the legacy service with the correct `id` (legacy {deliveryId} bug fixed)", async () => {
    const legacy = { deleteDeliverySchedule: vi.fn().mockResolvedValue({ id: 52 }) };
    const usecase = new DeliveryUsecase({}, makeProjects(), legacy);
    await usecase.remove({ deliveryId: 52 });
    expect(legacy.deleteDeliverySchedule).toHaveBeenCalledWith({ id: 52 });
  });
});
