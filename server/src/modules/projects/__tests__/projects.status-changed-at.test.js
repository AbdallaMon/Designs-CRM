// statusChangedAt is stamped by the ONE legacy status-write path (updateProject in
// project.flows.js) — only when the status actually changes.
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateProjectById = vi.fn(async ({ id, data }) => ({ id, ...data }));
const findProjectDeliveryStatus = vi.fn(async () => ({ deliveryTime: null, status: "To Do" }));
const findProjectWithAssignments = vi.fn(async () => ({
  id: 10, status: "3D", type: "3D_Designer", clientLeadId: 5,
  startedAt: new Date(), endedAt: null, assignments: [], groupId: 1,
}));
const setProjectStarted = vi.fn(async () => ({}));
const setProjectEnded = vi.fn(async () => ({}));
const updateManyModification = vi.fn(async () => ({}));

vi.mock("../project/project.repo.js", () => ({
  projectRepository: {
    updateProjectById, findProjectDeliveryStatus, findProjectWithAssignments,
    setProjectStarted, setProjectEnded, updateManyModification,
  },
}));

// project.flows.js side-effect imports (its exact import block, verified 2026-07-16):
vi.mock("../../../infra/notifications/index.js", () => ({
  newProjectAssingmentNotification: vi.fn(),
  updateProjectNotification: vi.fn(),
}));
vi.mock("../../chat/system-rooms.js", () => ({
  addADesginerToAllRelatedProjectsRooms: vi.fn(),
}));
vi.mock("../../contracts/contract/contract.workflow.repo.js", () => ({
  checkIfProjectHasStagesAndUpdateNextAndPrevious: vi.fn(),
  checkIfProjectHasPaymentAndUpdate: vi.fn(),
}));
vi.mock("../../../infra/telegram/telegram-functions.js", () => ({
  addUsersToATeleChannelUsingQueue: vi.fn(),
  notifyUsersAddedToProject: vi.fn(),
  notifyUsersWithTheNewProjectStatus: vi.fn(),
  uploadANote: vi.fn(),
}));
vi.mock("../../../infra/config/links.js", () => ({ dealsLink: "http://x/deals" }));

const { projectOperations } = await import("../project/project.flows.js");

beforeEach(() => vi.clearAllMocks());

describe("updateProject statusChangedAt stamp", () => {
  it("stamps statusChangedAt when status changes", async () => {
    await projectOperations.updateProject({
      data: { id: 10, status: "3D", oldStatus: "To Do", isAdmin: true },
      isAdmin: true,
    });
    const data = updateProjectById.mock.calls[0][0].data;
    expect(data.status).toBe("3D");
    expect(data.statusChangedAt).toBeInstanceOf(Date);
  });

  it("does NOT stamp when status is unchanged (same value)", async () => {
    findProjectDeliveryStatus.mockResolvedValueOnce({ deliveryTime: null, status: "3D" });
    await projectOperations.updateProject({
      data: { id: 10, status: "3D", oldStatus: "3D", isAdmin: true },
      isAdmin: true,
    });
    expect(updateProjectById.mock.calls[0][0].data.statusChangedAt).toBeUndefined();
  });

  it("does NOT stamp on a non-status edit (priority only)", async () => {
    await projectOperations.updateProject({
      data: { id: 10, priority: "HIGH", isAdmin: true },
      isAdmin: true,
    });
    expect(updateProjectById.mock.calls[0][0].data.statusChangedAt).toBeUndefined();
  });
});
