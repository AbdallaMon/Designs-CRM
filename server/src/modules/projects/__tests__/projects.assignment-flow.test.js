import { beforeEach, describe, expect, it, vi } from "vitest";
import { projectsMessagesCodes } from "@dms/shared";

vi.mock("../project/project.repo.js", () => ({
  projectRepository: {
    findAssignment: vi.fn(),
    findAssignmentById: vi.fn(),
    deleteAssignmentById: vi.fn(),
    findProjectWithAssignments: vi.fn(),
    findLeadDetailsByProject: vi.fn(),
  },
}));

vi.mock("../../../infra/notifications/index.js", () => ({
  newProjectAssingmentNotification: vi.fn(),
  updateProjectNotification: vi.fn(),
}));

vi.mock("../../chat/system-rooms.js", () => ({
  addADesginerToAllRelatedProjectsRooms: vi.fn(),
}));

vi.mock("../../../infra/telegram/telegram-functions.js", () => ({
  addUsersToATeleChannelUsingQueue: vi.fn(),
  notifyUsersAddedToProject: vi.fn(),
  notifyUsersWithTheNewProjectStatus: vi.fn(),
  uploadANote: vi.fn(),
}));

import { projectRepository } from "../project/project.repo.js";
import { assignProjectToUser, projectOperations } from "../project/project.flows.js";
import { ProjectValidation } from "../project/project.validation.js";

describe("project designer assignment flow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    projectRepository.findAssignmentById.mockResolvedValue({
      id: 44,
      projectId: 17,
      userId: 8,
    });
    projectRepository.deleteAssignmentById.mockResolvedValue({ id: 44 });
    projectRepository.findProjectWithAssignments.mockResolvedValue({
      id: 17,
      clientLeadId: null,
      assignments: [],
    });
  });

  it("removes a designer without querying for an undefined user id", async () => {
    await expect(
      assignProjectToUser({
        projectId: 17,
        assignmentId: 44,
        deleteDesigner: true,
      }),
    ).resolves.toMatchObject({ id: 17, assignments: [] });

    expect(projectRepository.findAssignment).not.toHaveBeenCalled();
    expect(projectRepository.deleteAssignmentById).toHaveBeenCalledWith({ id: 44 });
  });

  it("does not remove an assignment that belongs to another project", async () => {
    projectRepository.findAssignmentById.mockResolvedValue({
      id: 44,
      projectId: 18,
      userId: 8,
    });

    await expect(
      assignProjectToUser({
        projectId: 17,
        assignmentId: 44,
        deleteDesigner: true,
      }),
    ).rejects.toMatchObject({
      code: projectsMessagesCodes.PROJECT_ACCESS_DENIED,
      statusCode: 403,
    });
    expect(projectRepository.deleteAssignmentById).not.toHaveBeenCalled();
  });
});

describe("designer lead activity visibility parity", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    projectRepository.findLeadDetailsByProject.mockResolvedValue({ callReminders: [] });
  });

  it("keeps every lead attachment/note visible to an assigned 3D designer, including Sales uploads", async () => {
    await projectOperations.getLeadDetailsByProject(42, {
      type: "3D_Designer",
      userId: 7,
    });

    expect(projectRepository.findLeadDetailsByProject).toHaveBeenCalledWith(
      expect.objectContaining({
        filesAndNotesWhere: {},
        userIdWhere: { userId: 7 },
      }),
    );
  });

  it("preserves master's 2D attachment/note and all-designer call ownership filters", async () => {
    await projectOperations.getLeadDetailsByProject(42, {
      type: "2D_Study",
      userId: 7,
    });

    expect(projectRepository.findLeadDetailsByProject).toHaveBeenCalledWith(
      expect.objectContaining({
        filesAndNotesWhere: { userId: 7 },
        userIdWhere: { userId: 7 },
      }),
    );
  });
});

describe("project designer assignment validation", () => {
  it("requires an assignment id only on the remove path", () => {
    expect(
      ProjectValidation.assignDesigner.safeParse({
        deleteDesigner: true,
        assignmentId: 44,
      }).success,
    ).toBe(true);
    expect(
      ProjectValidation.assignDesigner.safeParse({ deleteDesigner: true }).success,
    ).toBe(false);
  });

  it("requires a designer id on the add path", () => {
    expect(
      ProjectValidation.assignDesigner.safeParse({ designerId: 8 }).success,
    ).toBe(true);
    expect(ProjectValidation.assignDesigner.safeParse({}).success).toBe(false);
  });
});
