// Static, language-neutral config for the site-utility feature. Mirrors the legacy
// admin UI (UiComponents/DataViewer/website-utilities/*) so behaviour/appearance is
// preserved — only the data layer + folder shape changed.

// PDF-utility editable fields. Each maps to a key on the singleton pdf-utility object.
// (Legacy PdfUtility.jsx default `fields`; commented-out legacy entries kept out.)
export const PDF_UTILITY_FIELDS = [
  { key: "pdfFrame", label: "PDF Frame" },
  { key: "introPage", label: "Intro Page" },
];

// Contract-payment-condition types → allowed condition values. Copied verbatim from the
// legacy admin UI which read these from helpers/constants PROJECT_STATUSES. Kept local so
// the feature is self-contained and does not depend on the legacy constants module.
export const CONDITION_TYPE_OPTIONS = {
  "3D_Designer": [
    "To Do",
    "3D",
    "Render",
    "Modification",
    "Delivery",
    "Hold",
    "Completed",
  ],
  "3D_Modification": ["To Do", "Modification", "Completed"],
  "2D_Study": [
    "To Do",
    "Studying",
    "Modification",
    "Delivery",
    "Electricity",
    "Hold",
    "Completed",
  ],
  "2D_Final_Plans": ["To Do", "Started", "In Progress", "Completed"],
  "2D_Quantity_Calculation": ["To Do", "Started", "In Progress", "Completed"],
};

// Max upload size (bytes) — mirrors v2 shared FILES.SIZE_LIMIT (kept local to avoid a
// cross-feature import; reconcile if the shared value changes).
export const FILE_SIZE_LIMIT = 500 * 1024 * 1024;
