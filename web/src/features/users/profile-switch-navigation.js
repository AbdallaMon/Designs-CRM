const SALES_PROFILES = new Set(["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"]);

function findTab(navigationTabs, key) {
  return (navigationTabs ?? []).find((tab) => tab?.key === key);
}

export function resolveProfileLanding({ profileKey, navigationTabs = [] }) {
  const workStages = findTab(navigationTabs, "work-stages");

  if (profileKey === "DESIGNER_3D") {
    return workStages?.href || "/dashboard/work-stages";
  }

  if (profileKey === "DESIGNER_2D") {
    return workStages?.subLinks?.[0]?.href || "/dashboard/work-stages/study";
  }

  if (SALES_PROFILES.has(profileKey)) {
    return findTab(navigationTabs, "deals")?.href || "/dashboard/deals";
  }

  return navigationTabs[0]?.href || "/dashboard";
}
