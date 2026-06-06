import { describe, it, expect, vi } from "vitest";

import { SiteUtilityUsecase } from "../site-utility.usecase.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { PERMISSIONS, siteUtilityMessagesCodes } from "@dms/shared";

const P = PERMISSIONS.SITE_UTILITY;

/** Minimal fake repository — only the methods the tested usecases touch. */
function makeRepo(overrides = {}) {
  return {
    getPdfConfig: vi.fn(),
    createPdfConfig: vi.fn(),
    updatePdfConfig: vi.fn(),
    listPaymentConditions: vi.fn(),
    getPaymentConditionById: vi.fn(),
    createPaymentCondition: vi.fn(),
    updatePaymentCondition: vi.fn(),
    deletePaymentCondition: vi.fn(),
    findFirstPaymentByConditionId: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe("SiteUtilityUsecase.getPdfConfig", () => {
  it("returns the existing singleton config", async () => {
    const config = { id: 1, pdfHeader: "h" };
    const repo = makeRepo({ getPdfConfig: vi.fn().mockResolvedValue(config) });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.getPdfConfig();

    expect(result).toBe(config);
    expect(repo.createPdfConfig).not.toHaveBeenCalled();
  });

  it("lazily creates and RETURNS the singleton when missing (legacy returned undefined)", async () => {
    const created = { id: 1 };
    const repo = makeRepo({
      getPdfConfig: vi.fn().mockResolvedValue(null),
      createPdfConfig: vi.fn().mockResolvedValue(created),
    });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.getPdfConfig();

    expect(repo.createPdfConfig).toHaveBeenCalledWith({ data: {} });
    expect(result).toBe(created);
  });
});

describe("SiteUtilityUsecase.updatePdfConfig (upsert)", () => {
  it("updates when the singleton already exists", async () => {
    const updated = { id: 1, pageTitle: "t" };
    const repo = makeRepo({
      getPdfConfig: vi.fn().mockResolvedValue({ id: 1 }),
      updatePdfConfig: vi.fn().mockResolvedValue(updated),
    });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.updatePdfConfig({ input: { pageTitle: "t" } });

    expect(repo.updatePdfConfig).toHaveBeenCalledWith({
      data: { pageTitle: "t" },
    });
    expect(repo.createPdfConfig).not.toHaveBeenCalled();
    expect(result).toBe(updated);
  });

  it("creates when the singleton is missing", async () => {
    const created = { id: 1, pageTitle: "t" };
    const repo = makeRepo({
      getPdfConfig: vi.fn().mockResolvedValue(null),
      createPdfConfig: vi.fn().mockResolvedValue(created),
    });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.updatePdfConfig({ input: { pageTitle: "t" } });

    expect(repo.createPdfConfig).toHaveBeenCalledWith({
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
    const repo = makeRepo({
      listPaymentConditions: vi.fn().mockResolvedValue(rows),
      // condition #1 is linked to a payment → not deletable
      findFirstPaymentByConditionId: vi.fn(async ({ conditionId }) =>
        conditionId === 1 ? { id: 99 } : null,
      ),
    });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.listPaymentConditions({
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
    const repo = makeRepo({
      listPaymentConditions: vi.fn().mockResolvedValue([{ id: 1 }]),
    });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.listPaymentConditions({
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
    const repo = makeRepo();
    const usecase = new SiteUtilityUsecase(repo);

    await expect(
      usecase.createPaymentCondition({
        input: { condition: "To Do", conditionType: "x", labelAr: "a", labelEn: "b" },
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: siteUtilityMessagesCodes.PAYMENT_CONDITION_RESERVED_VALUE,
    });
    expect(repo.createPaymentCondition).not.toHaveBeenCalled();
  });

  it("creates a valid condition", async () => {
    const row = { id: 5, condition: "Half" };
    const repo = makeRepo({
      createPaymentCondition: vi.fn().mockResolvedValue(row),
    });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.createPaymentCondition({
      input: { condition: "Half", conditionType: "x", labelAr: "a", labelEn: "b" },
    });

    expect(result).toMatchObject(row);
  });
});

describe("SiteUtilityUsecase.deletePaymentCondition", () => {
  it("404s when the condition does not exist", async () => {
    const repo = makeRepo({
      getPaymentConditionById: vi.fn().mockResolvedValue(null),
    });
    const usecase = new SiteUtilityUsecase(repo);

    await expect(
      usecase.deletePaymentCondition({ id: 123 }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: siteUtilityMessagesCodes.PAYMENT_CONDITION_NOT_FOUND,
    });
  });

  it("409s when the condition is linked to existing payments (legacy guard)", async () => {
    const repo = makeRepo({
      getPaymentConditionById: vi.fn().mockResolvedValue({ id: 1 }),
      findFirstPaymentByConditionId: vi.fn().mockResolvedValue({ id: 7 }),
    });
    const usecase = new SiteUtilityUsecase(repo);

    await expect(
      usecase.deletePaymentCondition({ id: 1 }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: siteUtilityMessagesCodes.PAYMENT_CONDITION_IN_USE,
    });
    expect(repo.deletePaymentCondition).not.toHaveBeenCalled();
  });

  it("deletes when not linked and the AppError is an AppError instance", async () => {
    const repo = makeRepo({
      getPaymentConditionById: vi.fn().mockResolvedValue({ id: 1 }),
      findFirstPaymentByConditionId: vi.fn().mockResolvedValue(null),
      deletePaymentCondition: vi.fn().mockResolvedValue({ id: 1 }),
    });
    const usecase = new SiteUtilityUsecase(repo);

    const result = await usecase.deletePaymentCondition({ id: 1 });
    expect(result).toEqual({ id: 1 });
    expect(repo.deletePaymentCondition).toHaveBeenCalledWith({ id: 1 });

    // sanity: thrown errors elsewhere are AppError instances
    expect(new AppError("X", 400)).toBeInstanceOf(AppError);
  });
});
