import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminResidualMessagesCodes } from "@dms/shared";
import { reportsController } from "../reports/reports.controller.js";
import { reportsUsecase } from "../reports/reports.usecase.js";

function response() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res;
}

describe("reports controller envelope", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("wraps lead report data in the canonical envelope", async () => {
    const data = { leads: [], summary: { totalLeads: 0 } };
    vi.spyOn(reportsUsecase, "getLeadReportData").mockResolvedValue(
      data,
    );
    const res = response();

    await reportsController.getLeadReportData(
      { body: {} },
      res,
    );

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: adminResidualMessagesCodes.LEAD_REPORT_GENERATED,
      data,
      translationKey: "adminResidualMessages",
    });
  });

  it("wraps staff report data in the canonical envelope", async () => {
    const data = { staffStats: [], summary: { totalStaff: 0 } };
    vi.spyOn(reportsUsecase, "getStaffReportData").mockResolvedValue(data);
    const res = response();

    await reportsController.getStaffReportData({ body: {} }, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: adminResidualMessagesCodes.STAFF_REPORT_GENERATED,
      data,
      translationKey: "adminResidualMessages",
    });
  });

  it.each([
    ["leadReportPdf", "leadReportPdf"],
    ["staffReportPdf", "staffReportPdf"],
  ])(
    "passes the response through %s without wrapping or changing PDF bytes",
    async (controllerMethod, usecaseMethod) => {
      const bytes = Buffer.from("unchanged-pdf-bytes");
      const res = response();
      res.end = vi.fn(() => res);
      vi.spyOn(reportsUsecase, usecaseMethod).mockImplementation(
        async ({ res: binaryResponse }) => {
          binaryResponse.end(bytes);
          return binaryResponse;
        },
      );

      const result = await reportsController[controllerMethod]({ body: {} }, res);

      expect(reportsUsecase[usecaseMethod]).toHaveBeenCalledWith({ body: {}, res });
      expect(res.end).toHaveBeenCalledWith(bytes);
      expect(res.json).not.toHaveBeenCalled();
      expect(result).toBe(res);
    },
  );
});
