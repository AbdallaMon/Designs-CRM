import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// `deals()` now calls the module-level `getClientLeadsByDateRange` directly (no DI bag),
// so spy on it via a module mock. The lead repo is left REAL — `hasFullScope` is a pure
// predicate we assert against below.
vi.mock("../lead.assign-status.usecase.js", () => ({
  getClientLeadsByDateRange: vi.fn(),
  getClientLeadsColumnStatus: vi.fn(),
  assignLeadToAUser: vi.fn(),
  bulkAssignLeadTsoAUser: vi.fn(),
  markClientLeadAsConverted: vi.fn(),
  updateClientLeadStatus: vi.fn(),
  checkIfUserAllowedToTakeALead: vi.fn(),
  claimStatus: vi.fn(),
}));

import { LeadUsecase } from "../lead.usecase.js";
import { leadRepository } from "../lead.repo.js";
import { projectRepository } from "../../../projects/project/project.repo.js";
import { getClientLeadsByDateRange } from "../lead.assign-status.usecase.js";
import { authMessagesCodes, PERMISSIONS } from "@dms/shared";

const uc = new LeadUsecase();

describe("designer work-stage activity scope", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(["DESIGNER_3D", "DESIGNER_2D"])(
    "allows an assigned %s profile to mutate notes/calls/files for the project lead",
    async (currentProfileKey) => {
      vi.spyOn(leadRepository, "findScopedLead").mockResolvedValue(null);
      const assigned = vi
        .spyOn(projectRepository, "clientLeadHasAssignedProject")
        .mockResolvedValue(true);

      await expect(
        uc.checkIfUserCanMutateLeadActivity({
          id: 42,
          authUser: { id: 7, currentProfileKey },
        }),
      ).resolves.toMatchObject({ clientLeadId: 42, assignedProject: true });

      expect(assigned).toHaveBeenCalledWith({ clientLeadId: 42, userId: 7 });
    },
  );

  it("denies a designer who is not assigned to any project under the lead", async () => {
    vi.spyOn(leadRepository, "findScopedLead").mockResolvedValue(null);
    vi.spyOn(projectRepository, "clientLeadHasAssignedProject").mockResolvedValue(false);

    await expect(
      uc.checkIfUserCanMutateLeadActivity({
        id: 42,
        authUser: { id: 7, currentProfileKey: "DESIGNER_3D" },
      }),
    ).rejects.toMatchObject({ code: "LEAD_MUTATE_DENIED", statusCode: 403 });
  });

  it.each(["DESIGNER_3D", "DESIGNER_2D"])(
    "allows an assigned %s profile through the related-lead read scope",
    async (currentProfileKey) => {
      vi.spyOn(leadRepository, "findScopedLead").mockResolvedValue(null);
      const assigned = vi
        .spyOn(projectRepository, "clientLeadHasAssignedProject")
        .mockResolvedValue(true);

      await expect(
        uc.checkIfUserCanAccessLeadOrAssignedProject({
          id: 42,
          authUser: { id: 7, currentProfileKey },
          mode: "view",
        }),
      ).resolves.toMatchObject({ clientLeadId: 42, assignedProject: true });

      expect(assigned).toHaveBeenCalledWith({ clientLeadId: 42, userId: 7 });
    },
  );

  it("keeps an unassigned designer denied from related lead resources", async () => {
    vi.spyOn(leadRepository, "findScopedLead").mockResolvedValue(null);
    vi.spyOn(projectRepository, "clientLeadHasAssignedProject").mockResolvedValue(false);

    await expect(
      uc.checkIfUserCanAccessLeadOrAssignedProject({
        id: 42,
        authUser: { id: 7, currentProfileKey: "DESIGNER_3D" },
        mode: "view",
      }),
    ).rejects.toMatchObject({ code: "LEAD_ACCESS_DENIED", statusCode: 403 });
  });
});

describe("LeadUsecase profile scope signals", () => {
  it("treats the active SUPER_SALES profile as a lead workflow supervisor", () => {
    expect(uc.isAdminUser({ currentProfileKey: "ADMIN", isAdminTier: true })).toBe(true);
    expect(uc.isAdminUser({ currentProfileKey: "SUPER_ADMIN", isAdminTier: true })).toBe(true);
    expect(uc.isAdminUser({ currentProfileKey: "SUPER_SALES", isAdminTier: false })).toBe(true);
    expect(uc.isAdminUser({ currentProfileKey: "NORMAL_SALES", isAdminTier: false })).toBe(false);
    expect(uc.isAdminUser({ role: "ADMIN", isAdminTier: false })).toBe(false);
  });

  it("repo.hasFullScope keys off the profile, not the flags", () => {
    expect(leadRepository.hasFullScope({ currentProfileKey: "SUPER_SALES" })).toBe(true);
    expect(leadRepository.hasFullScope({ isSuperSales: true })).toBe(false);
    expect(leadRepository.hasFullScope({ currentProfileKey: "ADMIN", isAdminTier: true })).toBe(true);
    expect(leadRepository.hasFullScope({
      currentProfileKey: "CONTACT_INITIATOR",
      includeContactInitiator: true,
    })).toBe(true);
  });

  it("only exposes consulted unassigned NEW leads through the staff claimable pool", () => {
    const where = leadRepository.buildAuthUserLeadWhere({
      authUser: { id: 7, currentProfileKey: "NORMAL_SALES", isAdminTier: false },
      where: { id: 42 },
      mode: "view",
    });

    expect(where.AND).toContainEqual({
      OR: [
        { userId: 7 },
        { userId: null, status: "NEW", initialConsult: true },
      ],
    });
  });

  it.each([
    ["non-consulted", { noConsulted: "true" }],
    ["on-hold", { assignedOverdue: "true" }],
  ])("rejects the %s pool when its explicit view permission is missing", async (_pool, query) => {
    await expect(
      uc.listLeads({
        query,
        authUser: { id: 7, permissions: [PERMISSIONS.LEAD.LIST] },
        page: 1,
        limit: 10,
        skip: 0,
      }),
    ).rejects.toMatchObject({
      code: authMessagesCodes.PERMISSION_DENIED,
      statusCode: 403,
    });
  });
});

describe("deals() super-sales scope (#6 regression)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getClientLeadsByDateRange.mockResolvedValue([]);
  });

  it("does NOT self-scope a SUPER_SALES profile user", async () => {
    await uc.getDeals({
      query: {},
      authUser: { id: 5, currentProfileKey: "SUPER_SALES", isAdminTier: false },
    });
    const { searchParams, isAdmin } = getClientLeadsByDateRange.mock.calls[0][0];
    expect(searchParams.userId).toBeUndefined();
    expect(searchParams.selfId).toBeUndefined();
    expect(isAdmin).toBe(true);
  });

  it("DOES self-scope a NORMAL_SALES profile user", async () => {
    await uc.getDeals({
      query: {},
      authUser: { id: 7, currentProfileKey: "NORMAL_SALES", isAdminTier: false },
    });
    const { searchParams, isAdmin } = getClientLeadsByDateRange.mock.calls[0][0];
    expect(searchParams.userId).toBe(7);
    expect(searchParams.selfId).toBe(7);
    expect(isAdmin).toBe(false);
  });
});
