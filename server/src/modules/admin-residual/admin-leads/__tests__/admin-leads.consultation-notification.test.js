import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../admin-leads.repo.js", () => ({
  adminLeadsRepository: {
    findLeadInitialConsult: vi.fn(),
    updateLeadField: vi.fn(),
  },
}));

vi.mock("../../../leads/lead/lead.repo.js", () => ({
  leadRepository: {
    generateCodeForNewLead: vi.fn(),
    uploadFile: vi.fn(),
  },
}));

vi.mock("../../../../infra/notifications/index.js", () => ({
  consultedLeadNotification: vi.fn(),
  newLeadNotification: vi.fn(),
}));

vi.mock("../../../../infra/telegram/telegram-functions.js", () => ({
  addUsersToATeleChannelUsingQueue: vi.fn(),
  createChannelAndAddUsers: vi.fn(),
}));

import { adminLeadsUsecase } from "../admin-leads.usecase.js";
import { adminLeadsRepository } from "../admin-leads.repo.js";
import { consultedLeadNotification } from "../../../../infra/notifications/index.js";

describe("AdminLeadsUsecase initial-consult transition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminLeadsRepository.updateLeadField.mockResolvedValue({ id: 42, initialConsult: true });
  });

  it("notifies sales once when a lead moves from non-consulted to consulted", async () => {
    adminLeadsRepository.findLeadInitialConsult.mockResolvedValue({ initialConsult: false });

    await adminLeadsUsecase.updateLeadField({
      id: 42,
      body: { field: "initialConsult", initialConsult: true },
    });

    expect(consultedLeadNotification).toHaveBeenCalledOnce();
    expect(consultedLeadNotification).toHaveBeenCalledWith(42);
  });

  it("does not duplicate the sales notification when the lead is already consulted", async () => {
    adminLeadsRepository.findLeadInitialConsult.mockResolvedValue({ initialConsult: true });

    await adminLeadsUsecase.updateLeadField({
      id: 42,
      body: { field: "initialConsult", initialConsult: true },
    });

    expect(consultedLeadNotification).not.toHaveBeenCalled();
  });
});
