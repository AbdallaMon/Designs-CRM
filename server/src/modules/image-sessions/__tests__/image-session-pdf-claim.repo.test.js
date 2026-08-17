import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  clientImageSession: {
    updateMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("../../../infra/prisma/prisma.js", () => ({ default: prismaMock }));

import {
  claimPdfGeneration,
  releasePdfGenerationClaim,
} from "../session/image-session.repo.js";

describe("image-session PDF generation claim", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims only an eligible or stale uncommitted session", async () => {
    const staleBefore = new Date("2026-08-16T11:55:00Z");
    prismaMock.clientImageSession.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.clientImageSession.findUnique.mockResolvedValue({
      id: 7,
      token: "tok",
      clientLeadId: 10,
      sessionStatus: "PDF_GENERATED",
      customColors: null,
    });

    await claimPdfGeneration({
      token: "tok",
      signatureUrl: "/uploads/sig.png",
      staleBefore,
    });

    expect(prismaMock.clientImageSession.updateMany).toHaveBeenCalledWith({
      where: {
        token: "tok",
        pdfUrl: null,
        OR: [
          { sessionStatus: "SELECTED_IMAGES" },
          { sessionStatus: "PDF_GENERATED", updatedAt: { lt: staleBefore } },
        ],
      },
      data: {
        sessionStatus: "PDF_GENERATED",
        signatureUrl: "/uploads/sig.png",
      },
    });
  });

  it("releases only the exact failed claim lease", async () => {
    const claimUpdatedAt = new Date("2026-08-16T12:00:00Z");
    prismaMock.clientImageSession.updateMany.mockResolvedValue({ count: 1 });

    await releasePdfGenerationClaim({ token: "tok", claimUpdatedAt });

    expect(prismaMock.clientImageSession.updateMany).toHaveBeenCalledWith({
      where: {
        token: "tok",
        sessionStatus: "PDF_GENERATED",
        pdfUrl: null,
        updatedAt: claimUpdatedAt,
      },
      data: { sessionStatus: "SELECTED_IMAGES" },
    });
  });
});
