import { describe, expect, it } from "vitest";
import { resolveProfileLanding } from "../profile-switch-navigation.js";

const dashboard = { key: "dashboard", href: "/dashboard" };
const deals = { key: "deals", href: "/dashboard/deals" };

describe("resolveProfileLanding", () => {
  it("lands 3D designers on the main 3D work-stage board", () => {
    expect(
      resolveProfileLanding({
        profileKey: "DESIGNER_3D",
        navigationTabs: [
          dashboard,
          {
            key: "work-stages",
            href: "/dashboard/work-stages",
            subLinks: [{ href: "/dashboard/work-stages/modification" }],
          },
        ],
      }),
    ).toBe("/dashboard/work-stages");
  });

  it("lands 2D designers on the first Work stages sub-link", () => {
    expect(
      resolveProfileLanding({
        profileKey: "DESIGNER_2D",
        navigationTabs: [
          dashboard,
          {
            key: "work-stages",
            href: "/dashboard/work-stages",
            subLinks: [
              { href: "/dashboard/work-stages/study" },
              { href: "/dashboard/work-stages/final-plan" },
            ],
          },
        ],
      }),
    ).toBe("/dashboard/work-stages/study");
  });

  it("uses the 2D Study landing when the backend tab has no sub-links", () => {
    expect(
      resolveProfileLanding({
        profileKey: "DESIGNER_2D",
        navigationTabs: [
          dashboard,
          { key: "work-stages", href: "/dashboard/work-stages" },
        ],
      }),
    ).toBe("/dashboard/work-stages/study");
  });

  it.each(["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"])(
    "lands %s on Deals",
    (profileKey) => {
      expect(resolveProfileLanding({ profileKey, navigationTabs: [dashboard, deals] })).toBe(
        "/dashboard/deals",
      );
    },
  );

  it("uses the first backend navigation tab for other profiles", () => {
    expect(
      resolveProfileLanding({
        profileKey: "ACCOUNTANT",
        navigationTabs: [{ key: "accountant-payments", href: "/dashboard" }],
      }),
    ).toBe("/dashboard");
  });
});
