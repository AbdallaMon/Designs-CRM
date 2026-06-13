export const sessionStatusFlow = {
  INITIAL: {
    next: "PREVIEW_COLOR_PATTERN",
    back: null,
  },
  PREVIEW_COLOR_PATTERN: {
    next: "SELECTED_COLOR_PATTERN",
    back: "INITIAL",
  },
  SELECTED_COLOR_PATTERN: {
    next: "PREVIEW_MATERIAL",
    back: "PREVIEW_COLOR_PATTERN",
  },
  PREVIEW_MATERIAL: {
    next: "SELECTED_MATERIAL",
    back: "SELECTED_COLOR_PATTERN",
  },
  SELECTED_MATERIAL: {
    next: "PREVIEW_STYLE",
    back: "PREVIEW_MATERIAL",
  },
  PREVIEW_STYLE: {
    next: "SELECTED_STYLE",
    back: "SELECTED_MATERIAL",
  },
  SELECTED_STYLE: {
    next: "PREVIEW_IMAGES",
    back: "PREVIEW_STYLE",
  },
  PREVIEW_IMAGES: {
    next: "SELECTED_IMAGES",
    back: "SELECTED_STYLE",
  },
  SELECTED_IMAGES: {
    next: "PDF_GENERATED",
    back: "PREVIEW_IMAGES",
  },
  PDF_GENERATED: {
    next: "SUBMITTED",
    back: "SELECTED_IMAGES",
  },
  SUBMITTED: {
    next: null,
    back: "PDF_GENERATED",
  },
};
