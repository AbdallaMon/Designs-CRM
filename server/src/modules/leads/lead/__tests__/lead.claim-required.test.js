import { describe, it, expect, vi } from "vitest";
import { LeadUsecase } from "../lead.usecase.js";
import { leadsMessagesCodes as C } from "@dms/shared";

// Build a usecase whose detail query returns null (lead filtered out by the status
// carve-out) but the ownership probes distinguish the reason.
function makeUc({ unassignedNew, owner }) {
  const repo = {
    findFirstByUserId: vi.fn().mockResolvedValue(null),
    findOnHoldOwner: vi.fn().mockResolvedValue(null),
    findUnassignedNew: vi.fn().mockResolvedValue(unassignedNew),
    findLeadOwner: vi.fn().mockResolvedValue(owner),
    findLeadDetail: vi.fn().mockResolvedValue(null),
  };
  return new LeadUsecase(repo, {});
}

const STAFF = { id: 5, role: "STAFF", currentProfileKey: "NORMAL_SALES" };

describe("#getStaffDetail meaningful errors (#1)", () => {
  it("NEW/unassigned claimable lead → LEAD_CLAIM_REQUIRED 409", async () => {
    const uc = makeUc({ unassignedNew: { id: 2 }, owner: { id: 2, userId: null, status: "NEW" } });
    await expect(uc.getById({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: C.LEAD_CLAIM_REQUIRED, statusCode: 409 });
  });

  it("lead owned by another → LEAD_ACCESS_DENIED 403", async () => {
    const uc = makeUc({ unassignedNew: null, owner: { id: 2, userId: 99, status: "NEGOTIATING" } });
    await expect(uc.getById({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: C.LEAD_ACCESS_DENIED, statusCode: 403 });
  });

  it("truly missing lead → LEAD_NOT_FOUND 404", async () => {
    const uc = makeUc({ unassignedNew: null, owner: null });
    await expect(uc.getById({ id: 2, query: {}, authUser: STAFF }))
      .rejects.toMatchObject({ code: C.LEAD_NOT_FOUND, statusCode: 404 });
  });
});
