// Default PDF branding assets, used by BOTH PDF subsystems (contract + image-session)
// and the SiteUtility signature validator so they agree on one set of fallbacks.
//
// These are the source of truth when the SiteUtility singleton has no value for a
// field. They are stored ROOT-RELATIVE (leading "/") on purpose: `toAbsoluteAssetUrl`
// in ./pdf-helpers.js only prepends CRM_DOMAIN to paths that start with "/", so a bare
// filename would not resolve. `fetchImageBuffer(url)` therefore turns these into
// `${CRM_DOMAIN}/Pdf-intro.png` etc. at fetch time.
export const PDF_ASSET_DEFAULTS = {
  // SiteUtility.introPage — full intro-page image.
  introPage: "/Pdf-intro.png",
  // SiteUtility.pdfSignaturePart — company signature/stamp (first party).
  pdfSignaturePart: "/dream-signature.png",
  // SiteUtility.pdfFrame — full-page background drawn behind every page.
  pdfFrame: "/uploads/19439a10-00f6-4c2a-81b9-1a3680f9089f.jpg",
};
