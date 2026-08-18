import { beforeEach, describe, expect, it, vi } from "vitest";
import { PERMISSIONS } from "@dms/shared";

const mocks = vi.hoisted(() => ({
  noteRepository: { resolveTarget: vi.fn() },
  leadRepository: { buildAuthUserLeadWhere: vi.fn(), findScopedLead: vi.fn() },
  projectRepository: {
    buildAuthUserProjectWhere: vi.fn(),
    findScopedProject: vi.fn(),
    clientLeadHasAssignedProject: vi.fn(),
  },
}));

vi.mock("../note.repo.js", () => ({ noteRepository: mocks.noteRepository }));
vi.mock("../../leads/lead/lead.repo.js", () => ({ leadRepository: mocks.leadRepository }));
vi.mock("../../projects/project/project.repo.js", () => ({ projectRepository: mocks.projectRepository }));
vi.mock("../../../infra/telegram/telegram-functions.js", () => ({
  getChannelEntitiyByTeleRecordAndLeadId: vi.fn(),
  uploadANote: vi.fn(),
}));
vi.mock("../../projects/update/update.repo.js", () => ({ updateRepository: {} }));
vi.mock("../../projects/task/task.usecase.js", () => ({ updateTask: vi.fn() }));

import { checkNoteTargetAccess } from "../note.usecase.js";

const designer = {
  id: 8,
  currentProfileKey: "DESIGNER_3D",
  permissions: [PERMISSIONS.LEAD.NOTE_MANAGE],
};

describe("lead-note scope for designer work stages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.noteRepository.resolveTarget.mockResolvedValue({ kind: "lead", clientLeadId: 44 });
    mocks.leadRepository.buildAuthUserLeadWhere.mockReturnValue({ id: 44 });
    mocks.leadRepository.findScopedLead.mockResolvedValue(null);
  });

  it("allows an assigned designer to write a note on the backing lead", async () => {
    mocks.projectRepository.clientLeadHasAssignedProject.mockResolvedValue(true);

    await expect(
      checkNoteTargetAccess({ idKey: "clientLeadId", id: 44, authUser: designer, mode: "mutate" }),
    ).resolves.toMatchObject({ clientLeadId: 44, assignedProject: true });
  });

  it("denies an unassigned designer", async () => {
    mocks.projectRepository.clientLeadHasAssignedProject.mockResolvedValue(false);

    await expect(
      checkNoteTargetAccess({ idKey: "clientLeadId", id: 44, authUser: designer, mode: "mutate" }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
