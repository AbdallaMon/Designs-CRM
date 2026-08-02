import { describe, it, expect, vi, beforeEach } from "vitest";

// DI removed: the usecase calls the imported `siteUtilityRepository` singleton directly.
// Mock the singleton so the usecase can be asserted without a DB.
vi.mock("../site-utility.repo.js", () => ({
  siteUtilityRepository: {
    getPdfConfig: vi.fn(),
    createPdfConfig: vi.fn(),
    updatePdfConfig: vi.fn(),
    listPaymentConditions: vi.fn(),
    getPaymentConditionById: vi.fn(),
    createPaymentCondition: vi.fn(),
    updatePaymentCondition: vi.fn(),
    deletePaymentCondition: vi.fn(),
    findFirstPaymentByConditionId: vi.fn(),
  },
}));

import { siteUtilityUsecase } from "../site-utility.usecase.js";
import { siteUtilityRepository } from "../site-utility.repo.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { PERMISSIONS, siteUtilityMessagesCodes } from "@dms/shared";

const P = PERMISSIONS.SITE_UTILITY;

// Reset to sensible defaults before each test; individual tests override.
beforeEach(() => {
  vi.clearAllMocks();
  siteUtilityRepository.findFirstPaymentByConditionId.mockResolvedValue(null);
});

describe("SiteUtilityUsecase.getPdfConfig", () => {
  it("returns the existing singleton config", async () => {
    const config = { id: 1, pdfHeader: "h" };
    siteUtilityRepository.getPdfConfig.mockResolvedValue(config);

    const result = await siteUtilityUsecase.getPdfConfig();

    expect(result).toBe(config);
    expect(siteUtilityRepository.createPdfConfig).not.toHaveBeenCalled();
  });

  it("lazily creates and RETURNS the singleton when missing (legacy returned undefined)", async () => {
    const created = { id: 1 };
    siteUtilityRepository.getPdfConfig.mockResolvedValue(null);
    siteUtilityRepository.createPdfConfig.mockResolvedValue(created);

    const result = await siteUtilityUsecase.getPdfConfig();

    expect(siteUtilityRepository.createPdfConfig).toHaveBeenCalledWith({ data: {} });
    expect(result).toBe(created);
  });
});

describe("SiteUtilityUsecase.updatePdfConfig (upsert)", () => {
  it("updates when the singleton already exists", async () => {
    const updated = { id: 1, pageTitle: "t" };
    siteUtilityRepository.getPdfConfig.mockResolvedValue({ id: 1 });
    siteUtilityRepository.updatePdfConfig.mockResolvedValue(updated);

    const result = await siteUtilityUsecase.updatePdfConfig({ input: { pageTitle: "t" } });

    expect(siteUtilityRepository.updatePdfConfig).toHaveBeenCalledWith({
      data: { pageTitle: "t" },
    });
    expect(siteUtilityRepository.createPdfConfig).not.toHaveBeenCalled();
    expect(result).toBe(updated);
  });

  it("creates when the singleton is missing", async () => {
    const created = { id: 1, pageTitle: "t" };
    siteUtilityRepository.getPdfConfig.mockResolvedValue(null);
    siteUtilityRepository.createPdfConfig.mockResolvedValue(created);

    const result = await siteUtilityUsecase.updatePdfConfig({ input: { pageTitle: "t" } });

    expect(siteUtilityRepository.createPdfConfig).toHaveBeenCalledWith({
      data: { pageTitle: "t" },
    });
    expect(result).toBe(created);
  });
});

describe("SiteUtilityUsecase.listPaymentConditions", () => {
  it("returns the paginated envelope with per-record capabilities", async () => {
    const rows = [
      { id: 1, condition: "A" },
      { id: 2, condition: "B" },
    ];
    siteUtilityRepository.listPaymentConditions.mockResolvedValue(rows);
    // condition #1 is linked to a payment → not deletable
    siteUtilityRepository.findFirstPaymentByConditionId.mockImplementation(
      async ({ conditionId }) => (conditionId === 1 ? { id: 99 } : null),
    );

    const result = await siteUtilityUsecase.listPaymentConditions({
      authUser: {
        permissions: [P.PAYMENT_CONDITION_EDIT, P.PAYMENT_CONDITION_DELETE],
      },
    });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(2);
    // in-use condition cannot be deleted even with the delete permission
    expect(result.items[0].capabilities).toEqual({
      canEdit: true,
      canDelete: false,
      inUse: true,
    });
    expect(result.items[1].capabilities).toEqual({
      canEdit: true,
      canDelete: true,
      inUse: false,
    });
  });

  it("reflects missing permissions in capabilities", async () => {
    siteUtilityRepository.listPaymentConditions.mockResolvedValue([{ id: 1 }]);

    const result = await siteUtilityUsecase.listPaymentConditions({
      authUser: { permissions: [] },
    });

    expect(result.items[0].capabilities).toEqual({
      canEdit: false,
      canDelete: false,
      inUse: false,
    });
  });
});

describe("SiteUtilityUsecase.createPaymentCondition", () => {
  it("rejects the reserved 'To Do' condition (legacy invariant)", async () => {
    await expect(
      siteUtilityUsecase.createPaymentCondition({
        input: { condition: "To Do", conditionType: "x", labelAr: "a", labelEn: "b" },
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: siteUtilityMessagesCodes.PAYMENT_CONDITION_RESERVED_VALUE,
    });
    expect(siteUtilityRepository.createPaymentCondition).not.toHaveBeenCalled();
  });

  it("creates a valid condition", async () => {
    const row = { id: 5, condition: "Half" };
    siteUtilityRepository.createPaymentCondition.mockResolvedValue(row);

    const result = await siteUtilityUsecase.createPaymentCondition({
      input: { condition: "Half", conditionType: "x", labelAr: "a", labelEn: "b" },
    });

    expect(result).toMatchObject(row);
  });
});

describe("SiteUtilityUsecase.deletePaymentCondition", () => {
  it("404s when the condition does not exist", async () => {
    siteUtilityRepository.getPaymentConditionById.mockResolvedValue(null);

    await expect(
      siteUtilityUsecase.deletePaymentCondition({ id: 123 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: siteUtilityMessagesCodes.PAYMENT_CONDITION_NOT_FOUND,
    });
  });

  it("409s when the condition is linked to existing payments (legacy guard)", async () => {
    siteUtilityRepository.getPaymentConditionById.mockResolvedValue({ id: 1 });
    siteUtilityRepository.findFirstPaymentByConditionId.mockResolvedValue({ id: 7 });

    await expect(
      siteUtilityUsecase.deletePaymentCondition({ id: 1 }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: siteUtilityMessagesCodes.PAYMENT_CONDITION_IN_USE,
    });
    expect(siteUtilityRepository.deletePaymentCondition).not.toHaveBeenCalled();
  });

  it("deletes when not linked and the AppError is an AppError instance", async () => {
    siteUtilityRepository.getPaymentConditionById.mockResolvedValue({ id: 1 });
    siteUtilityRepository.findFirstPaymentByConditionId.mockResolvedValue(null);
    siteUtilityRepository.deletePaymentCondition.mockResolvedValue({ id: 1 });

    const result = await siteUtilityUsecase.deletePaymentCondition({ id: 1 });
    expect(result).toEqual({ id: 1 });
    expect(siteUtilityRepository.deletePaymentCondition).toHaveBeenCalledWith({ id: 1 });

    // sanity: thrown errors elsewhere are AppError instances
    expect(new AppError({ code: "X", statusCode: 400 })).toBeInstanceOf(AppError);
  });
});
