import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  materials: [1],
  sessionStatus: "PREVIEW_MATERIAL",
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(),
}));

vi.mock("../../../infra/prisma/prisma.js", () => ({ default: prismaMock }));

import { saveClientSelectedMaterials } from "../client/client-image-session.repo.js";

describe("client image-session material transaction", () => {
  beforeEach(() => {
    db.materials = [1];
    db.sessionStatus = "PREVIEW_MATERIAL";
    vi.clearAllMocks();
  });

  it("rolls material replacement back when a later write fails", async () => {
    prismaMock.$transaction.mockImplementation(async (work) => {
      const snapshot = {
        materials: [...db.materials],
        sessionStatus: db.sessionStatus,
      };
      const tx = {
        materialOnClientImageSession: {
          deleteMany: vi.fn(async () => {
            db.materials = [];
          }),
          createMany: vi.fn(async () => {
            throw new Error("insert failed");
          }),
        },
        clientImageSession: {
          update: vi.fn(async ({ data }) => {
            db.sessionStatus = data.sessionStatus;
          }),
        },
      };
      try {
        return await work(tx);
      } catch (error) {
        db.materials = snapshot.materials;
        db.sessionStatus = snapshot.sessionStatus;
        throw error;
      }
    });

    await expect(
      saveClientSelectedMaterials({
        selectedMaterials: [{ id: 2 }],
        session: { id: 7 },
        status: "SELECTED_MATERIAL",
      }),
    ).rejects.toThrow("insert failed");

    expect(db.materials).toEqual([1]);
    expect(db.sessionStatus).toBe("PREVIEW_MATERIAL");
  });
});
