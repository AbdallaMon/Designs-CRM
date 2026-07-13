import { describe, it, expect, vi, beforeEach } from "vitest";

// The lead usecase now uses the `leadRepository` singleton directly (no DI). Mock it so
// the staff-detail query returns null (lead filtered out by the status carve-out) while
// the ownership probes distinguish the reason.
vi.mock("../lead.repo.js", () => ({
  leadRepository: {
    findFirstByUserId: vi.fn(),
    findOnHoldOwner: vi.fn(),
    findUnassignedNew: vi.fn(),
    findLeadOwner: vi.fn(),
    findLeadDetail: vi.fn(),
  },
  LeadRepository: class {},
}));

import { leadUsecase } from "../lead.usecase.js";
import { leadRepository } from "../lead.repo.js";
import { leadsMessagesCodes } from "@dms/shared";

// Configure the repo so the detail query returns null but the probes vary per scenario.
function setup({ unassignedNew, owner }) {
  leadRepository.findFirstByUserId.mockResolvedValue(null);
  leadRepository.findOnHoldOwner.mockResolvedValue(null);
  leadRepository.findUnassignedNew.mockResolvedValue(unassignedNew);
  leadRepository.findLeadOwner.mockResolvedValue(owner);
  leadRepository.findLeadDetail.mockResolvedValue(null);
}

const STAFF = { id: 5, role: "STAFF", currentProfileKey: "NORMAL_SALES" };

describe("#getStaffDetail meaningful errors (#1)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("NEW/unassigned claimable lead → LEAD_CLAIM_REQUIRED 409", async () => {
    setup({ unassignedNew: { id: 2 }, owner: { id: 2, userId: null, status: "NEW" } });
    await expect(leadUsecase.getLead({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: leadsMessagesCodes.LEAD_CLAIM_REQUIRED, statusCode: 409 });
  });

  it("lead owned by another → LEAD_ACCESS_DENIED 403", async () => {
    setup({ unassignedNew: null, owner: { id: 2, userId: 99, status: "NEGOTIATING" } });
    await expect(leadUsecase.getLead({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: leadsMessagesCodes.LEAD_ACCESS_DENIED, statusCode: 403 });
  });

  it("truly missing lead → LEAD_NOT_FOUND 404", async () => {
    setup({ unassignedNew: null, owner: null });
    await expect(leadUsecase.getLead({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: leadsMessagesCodes.LEAD_NOT_FOUND, statusCode: 404 });
  });
});
