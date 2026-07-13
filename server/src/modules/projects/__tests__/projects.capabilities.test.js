import { describe, it, expect, vi, beforeEach } from "vitest";

import { PERMISSIONS } from "@dms/shared";
import {
  withProjectDetailCapabilities,
  computeProjectCapabilities,
} from "../project/project.dto.js";

// DI was removed: the controller now calls the imported `projectUsecase` singleton
// directly, so the old `new ProjectController(usecase)` injection becomes a module mock.
vi.mock("../project/project.usecase.js", () => ({
  projectUsecase: { getDesignerLeadDetail: vi.fn() },
}));

import { projectController } from "../project/project.controller.js";
import { projectUsecase } from "../project/project.usecase.js";

const P = PERMISSIONS;

// Effective-permission arrays exactly as the auth middleware attaches them on
// req.auth.permissions (auth.middleware.js: req.auth = { ...payload, permissions }).
const ADMIN_PERMS = [P.PROJECT.EDIT, P.PROJECT.MANAGE, P.TASK.CREATE, P.DELIVERY.CREATE];
const DESIGNER_PERMS = [P.PROJECT.EDIT, P.TASK.CREATE, P.DELIVERY.CREATE]; // NO project.manage

const admin = { id: 1, role: "ADMIN", permissions: ADMIN_PERMS };
const assignedDesigner = { id: 4, role: "THREE_D_DESIGNER", permissions: DESIGNER_PERMS };
const otherDesigner = { id: 7, role: "TWO_D_DESIGNER", permissions: DESIGNER_PERMS };

// Shape returned by legacy getLeadDetailsByProject (designerLeadDetail): a clientLead
// carrying nested projects[], each project selecting assignments { user { id } }.
function makeDetailRecord() {
  return {
    id: 5, // clientLead id
    client: { name: "Acme" },
    projects: [
      { id: 10, type: "3D_Designer", status: "In Progress", assignments: [{ user: { id: 4 } }] },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withProjectDetailCapabilities (designer/project detail)", () => {
  it("is null-safe", () => {
    expect(withProjectDetailCapabilities(null, admin)).toBeNull();
    expect(withProjectDetailCapabilities(undefined, admin)).toBeUndefined();
  });

  it("attaches capabilities to the record AND each nested project (additive, no field loss)", () => {
    const out = withProjectDetailCapabilities(makeDetailRecord(), admin);
    expect(out.capabilities).toBeTruthy();
    expect(out.projects[0].capabilities).toBeTruthy();
    // existing fields preserved
    expect(out.id).toBe(5);
    expect(out.client).toEqual({ name: "Acme" });
    expect(out.projects[0].id).toBe(10);
    expect(out.projects[0].status).toBe("In Progress");
  });

  it("ADMIN → canAssignDesigner true (and full-scope → canEdit true) on the nested project", () => {
    const out = withProjectDetailCapabilities(makeDetailRecord(), admin);
    expect(out.projects[0].capabilities.canAssignDesigner).toBe(true);
    expect(out.projects[0].capabilities.canEdit).toBe(true);
  });

  it("assigned designer → canEdit true, canAssignDesigner false on their project", () => {
    const out = withProjectDetailCapabilities(makeDetailRecord(), assignedDesigner);
    expect(out.projects[0].capabilities.canEdit).toBe(true);
    expect(out.projects[0].capabilities.canAssignDesigner).toBe(false);
  });

  it("non-assigned non-admin → canEdit false on the nested project (scope gate)", () => {
    const out = withProjectDetailCapabilities(makeDetailRecord(), otherDesigner);
    expect(out.projects[0].capabilities.canEdit).toBe(false);
    expect(out.projects[0].capabilities.canAssignDesigner).toBe(false);
  });
});

describe("computeProjectCapabilities (single project row)", () => {
  it("assigned designer can edit their own project row; a stranger cannot", () => {
    const project = { id: 10, status: "In Progress", assignments: [{ user: { id: 4 } }] };
    expect(computeProjectCapabilities(project, assignedDesigner).canEdit).toBe(true);
    expect(computeProjectCapabilities(project, otherDesigner).canEdit).toBe(false);
  });
});

describe("ProjectController.getDesignerLeadDetail wiring", () => {
  it("responds with capabilities attached to the detail record + nested projects", async () => {
    projectUsecase.getDesignerLeadDetail.mockResolvedValue(makeDetailRecord());
    let payload;
    const res = { status: () => res, json: (body) => { payload = body; return res; } };
    const req = { params: { id: "5" }, query: {}, auth: assignedDesigner };

    await projectController.getDesignerLeadDetail(req, res);

    expect(projectUsecase.getDesignerLeadDetail).toHaveBeenCalledWith({ id: "5", query: {}, authUser: assignedDesigner });
    expect(payload.success).toBe(true);
    expect(payload.data.capabilities).toBeTruthy();
    expect(payload.data.projects[0].capabilities.canEdit).toBe(true);
    expect(payload.data.projects[0].capabilities.canAssignDesigner).toBe(false);
  });
});
