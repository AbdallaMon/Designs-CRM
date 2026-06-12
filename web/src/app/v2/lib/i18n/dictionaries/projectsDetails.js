// Per-feature UI dictionary: single-project detail page + tabs (ProjectDetailsPage).
//
// COMPOSITION MODEL: one file per feature/area. Fill BOTH `ar` and `en` with the SAME keys,
// namespaced under "projectsDetails.*". The barrel (./index.js) deep-merges every stub's `ar`
// into one ar map and `en` into one en map, then uiDictionary merges those on top of its core
// keys. You do NOT edit the barrel or uiDictionary — just fill this file and call
// t("projectsDetails.<key>") in the feature's components.
//
// CONTRACT: ar is the existing/authoritative wording (verbatim from the components it replaces),
// so ar renders identically. en is the additive natural translation. Keys identical across ar/en.

export const ar = {
  "projectsDetails.notFound": "هذا المشروع غير متاح أو لا تملك صلاحية عرضه.",
  "projectsDetails.back": "رجوع",
  "projectsDetails.label.production": "الإنتاج",
  "projectsDetails.label.projects": "المشاريع",
  "projectsDetails.label.client": "العميل",
  "projectsDetails.label.project": "المشروع",
  "projectsDetails.tab.overview": "نظرة عامة",
  "projectsDetails.tab.updates": "التحديثات",
};

export const en = {
  "projectsDetails.notFound": "This project is unavailable or you don't have permission to view it.",
  "projectsDetails.back": "Back",
  "projectsDetails.label.production": "Production",
  "projectsDetails.label.projects": "Projects",
  "projectsDetails.label.client": "Client",
  "projectsDetails.label.project": "Project",
  "projectsDetails.tab.overview": "Overview",
  "projectsDetails.tab.updates": "Updates",
};
