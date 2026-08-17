import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authMessagesCodes,
  generalMessagesCodes,
  PERMISSIONS,
  projectsMessagesCodes,
} from "@dms/shared";

const mocks = vi.hoisted(() => ({
  repository: {
    findModelCreatedAt: vi.fn(),
    resolveTarget: vi.fn(),
    deleteModel: vi.fn(),
    deleteMeetingReminderWithCleanup: vi.fn(),
    deleteContractWithDependents: vi.fn(),
    deleteClientLeadUpdateWithDependents: vi.fn(),
  },
  leadRepository: {
    buildAuthUserLeadWhere: vi.fn(),
    findScopedLead: vi.fn(),
  },
  projectRepository: {
    buildAuthUserProjectWhere: vi.fn(),
    findScopedProject: vi.fn(),
  },
  checkNoteDeletionAccess: vi.fn(),
  deleteCalendarEvent: vi.fn(),
}));

vi.mock("../generic-delete.repo.js", () => ({
  genericDeleteRepository: mocks.repository,
}));
vi.mock("../../leads/lead/lead.repo.js", () => ({
  leadRepository: mocks.leadRepository,
}));
vi.mock("../../projects/project/project.repo.js", () => ({
  projectRepository: mocks.projectRepository,
}));
vi.mock("../../notes/note.usecase.js", () => ({
  checkNoteDeletionAccess: mocks.checkNoteDeletionAccess,
}));
vi.mock("../../../infra/google/google-calendar.client.js", () => ({
  deleteCalendarEvent: mocks.deleteCalendarEvent,
}));

import {
  deleteAllowedModel,
  genericDeleteUsecase,
} from "../generic-delete.usecase.js";

function authUser(permissions = []) {
  return {
    id: 8,
    permissions,
    isAdminTier: false,
    currentProfileKey: "NORMAL_SALES",
  };
}

describe("generic delete authorization and scope", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.leadRepository.buildAuthUserLeadWhere.mockReturnValue({ id: 44 });
    mocks.projectRepository.buildAuthUserProjectWhere.mockReturnValue({ id: 55 });
  });

  it("denies a caller missing the model's action permission before scope lookup", async () => {
    await expect(
      genericDeleteUsecase.checkIfUserCanDeleteModel({
        id: 1,
        body: { model: "File" },
        authUser: authUser(),
      }),
    ).rejects.toMatchObject({
      code: authMessagesCodes.PERMISSION_DENIED,
      statusCode: 403,
    });
    expect(mocks.repository.resolveTarget).not.toHaveBeenCalled();
  });

  it("returns ACCESS_DENIED when the record is outside lead mutation scope", async () => {
    mocks.repository.resolveTarget.mockResolvedValue({
      kind: "lead",
      clientLeadId: 44,
    });
    mocks.leadRepository.findScopedLead.mockResolvedValue(null);

    await expect(
      genericDeleteUsecase.checkIfUserCanDeleteModel({
        id: 1,
        body: { model: "CallReminder" },
        authUser: authUser([PERMISSIONS.LEAD.CALL_MANAGE]),
      }),
    ).rejects.toMatchObject({
      code: authMessagesCodes.ACCESS_DENIED,
      statusCode: 403,
    });
    expect(mocks.leadRepository.buildAuthUserLeadWhere).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "mutate", where: { id: 44 } }),
    );
  });

  it("returns NOT_FOUND when the allowed target does not exist", async () => {
    mocks.repository.resolveTarget.mockResolvedValue(null);

    await expect(
      genericDeleteUsecase.checkIfUserCanDeleteModel({
        id: 404,
        body: { model: "File" },
        authUser: authUser([PERMISSIONS.LEAD.FILE_MANAGE]),
      }),
    ).rejects.toMatchObject({
      code: generalMessagesCodes.NOT_FOUND,
      statusCode: 404,
    });
  });

  it("requires note.delete in addition to the note target mutation check", async () => {
    await expect(
      genericDeleteUsecase.checkIfUserCanDeleteModel({
        id: 2,
        body: { model: "Note" },
        authUser: authUser([PERMISSIONS.LEAD.NOTE_MANAGE]),
      }),
    ).rejects.toMatchObject({ code: authMessagesCodes.PERMISSION_DENIED });
    expect(mocks.checkNoteDeletionAccess).not.toHaveBeenCalled();

    mocks.checkNoteDeletionAccess.mockResolvedValue({ id: 2 });
    await expect(
      genericDeleteUsecase.checkIfUserCanDeleteModel({
        id: 2,
        body: { model: "Note" },
        authUser: authUser([PERMISSIONS.NOTE.DELETE]),
      }),
    ).resolves.toEqual({ id: 2 });
  });
});

describe("generic delete orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.repository.findModelCreatedAt.mockResolvedValue({
      createdAt: new Date(),
    });
  });

  it("returns DELETE_NOT_ALLOWED when the deletion window has expired", async () => {
    mocks.repository.findModelCreatedAt.mockResolvedValue({
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    });

    await expect(
      deleteAllowedModel({
        id: 1,
        isAdmin: false,
        hasSuperSalesScope: false,
        data: { model: "File" },
      }),
    ).rejects.toMatchObject({
      code: projectsMessagesCodes.DELETE_NOT_ALLOWED,
      statusCode: 409,
    });
    expect(mocks.repository.deleteModel).not.toHaveBeenCalled();
  });

  it("does not call Google when meeting cleanup rolls back", async () => {
    const rollback = new Error("delete failed");
    mocks.repository.deleteMeetingReminderWithCleanup.mockRejectedValue(rollback);

    await expect(
      deleteAllowedModel({
        id: 7,
        isAdmin: true,
        hasSuperSalesScope: false,
        data: { model: "MeetingReminder" },
      }),
    ).rejects.toBe(rollback);
    expect(mocks.deleteCalendarEvent).not.toHaveBeenCalled();
  });

  it("deletes the Google event only after meeting DB cleanup commits", async () => {
    const order = [];
    const meeting = { googleEventId: "google-7", userId: 8 };
    mocks.repository.deleteMeetingReminderWithCleanup.mockImplementation(async () => {
      order.push("commit");
      return meeting;
    });
    mocks.deleteCalendarEvent.mockImplementation(async () => {
      order.push("google");
    });

    await deleteAllowedModel({
      id: 7,
      isAdmin: true,
      hasSuperSalesScope: false,
      data: { model: "MeetingReminder" },
    });

    expect(order).toEqual(["commit", "google"]);
  });

  it.each(["contract", "Contract"])(
    "routes %s through the contract teardown",
    async (model) => {
      await deleteAllowedModel({
        id: 9,
        isAdmin: true,
        hasSuperSalesScope: false,
        data: { model },
      });
      expect(mocks.repository.deleteContractWithDependents).toHaveBeenCalledWith({
        id: 9,
      });
      expect(mocks.repository.deleteModel).not.toHaveBeenCalled();
    },
  );

  it("routes ClientLeadUpdate through its scoped teardown", async () => {
    await deleteAllowedModel({
      id: 11,
      isAdmin: true,
      hasSuperSalesScope: false,
      data: { model: "ClientLeadUpdate" },
    });
    expect(
      mocks.repository.deleteClientLeadUpdateWithDependents,
    ).toHaveBeenCalledWith({ id: 11 });
    expect(mocks.repository.deleteModel).not.toHaveBeenCalled();
  });

  it("preserves the dedicated task endpoint's internal delete action", async () => {
    await deleteAllowedModel({
      id: 13,
      isAdmin: true,
      hasSuperSalesScope: false,
      data: { model: "Task" },
    });
    expect(mocks.repository.deleteModel).toHaveBeenCalledWith({
      model: "Task",
      id: 13,
    });
  });
});
