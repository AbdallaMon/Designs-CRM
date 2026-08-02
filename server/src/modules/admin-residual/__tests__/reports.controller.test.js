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
});
