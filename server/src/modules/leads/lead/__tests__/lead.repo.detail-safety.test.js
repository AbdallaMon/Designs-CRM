import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn().mockResolvedValue(null);

vi.mock("@dms/db", () => ({
  default: {
    clientLead: { findUnique },
  },
}));

let leadRepository;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ leadRepository } = await import("../lead.repo.js"));
});

describe("admin lead detail relation safety", () => {
  it("selects only the public assignee identity fields", async () => {
    await leadRepository.findAdminLeadDetail({ where: { id: 7 } });

    const { include } = findUnique.mock.calls[0][0];
    expect(include.assignedTo).toEqual({
      select: { id: true, name: true, email: true },
    });
    expect(include.assignedTo).not.toBe(true);
  });
});
