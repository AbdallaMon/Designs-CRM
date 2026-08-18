function normalizeHttpOrigin(value) {
  try {
    const parsed = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.origin : "";
  } catch {
    return "";
  }
}

export function buildBrandAssetUrl(
  pathname,
  origin = process.env.CRM_DOMAIN || process.env.DASHBOARD_ORIGIN,
) {
  const normalizedOrigin = normalizeHttpOrigin(origin);
  return normalizedOrigin
    ? new URL(pathname, `${normalizedOrigin}/`).toString()
    : pathname;
}

export const brandData = {
  colors: {
    primary: "#be975c",
    primaryLight: "#d3ac71",
    headingText: "#383028",
    bodyText: "#584d3f",
    mutedText: "#8a7f70",
    subtleText: "#666666",
    pageBg: "#f4f2ee",
    cardBg: "#fcfbf9",
    sectionBg: "#f8f6f3",
    divider: "#e8e2d9",
  },
  logoUrl: buildBrandAssetUrl("/main-logo.jpg"),
  dreamLogoUrl: buildBrandAssetUrl("/dream-logo.jpg"),
  companyName: "Dream Studio",
};
