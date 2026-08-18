import { describe, expect, it } from "vitest";

import { getProjectTypeLabel } from "../projectTypePresentation.js";

describe("getProjectTypeLabel", () => {
  it.each([
    ["3D_Designer", "3D Design"],
    ["3D_Modification", "3D Modification"],
    ["2D_Study", "2D Study"],
    ["2D_Final_Plans", "2D Final Plans"],
    ["2D_Quantity_Calculation", "2D Quantity Calculation"],
  ])("presents %s as %s", (type, expected) => {
    expect(getProjectTypeLabel(type)).toBe(expected);
  });

  it("keeps future project types readable", () => {
    expect(getProjectTypeLabel("4D_Client_Walkthrough")).toBe(
      "4D Client Walkthrough"
    );
  });
});
