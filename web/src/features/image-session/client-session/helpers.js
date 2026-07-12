import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

// --- Static-catalog cache -------------------------------------------------
// Colors / materials / styles / page-info are read-only lookups that don't
// change during a client session. Without caching, every Back/Next (and every
// language toggle) re-downloads them — costly on mobile data and it flashes a
// full-screen loader each time. We memoize by URL (which already encodes lng),
// so a revisited step renders instantly with no loader flash. The cache lives
// for the lifetime of the SPA session and resets on a hard reload.
const stepDataCache = new Map();

export async function getCachedStepData({ url, setData, setLoading }) {
  if (stepDataCache.has(url)) {
    setData(stepDataCache.get(url));
    setLoading?.(false);
    return;
  }
  await getDataAndSet({
    url,
    setLoading,
    setData: (data) => {
      stepDataCache.set(url, data);
      setData(data);
    },
  });
}

// --- Client wizard progress ----------------------------------------------
// Ordered list of every status the client passes through, used to render a
// single linear progress bar (index / last * 100) and a short phase label so
// the client always knows where they are and how much is left.
export const clientStatusOrder = [
  "INITIAL",
  "PREVIEW_COLOR_PATTERN",
  "SELECTED_COLOR_PATTERN",
  "PREVIEW_MATERIAL",
  "SELECTED_MATERIAL",
  "PREVIEW_STYLE",
  "SELECTED_STYLE",
  "PREVIEW_IMAGES",
  "SELECTED_IMAGES",
  "PDF_GENERATED",
  "SUBMITTED",
];

export const clientPhaseLabel = {
  INITIAL: { en: "Welcome", ar: "مرحباً" },
  PREVIEW_COLOR_PATTERN: { en: "Colors", ar: "الألوان" },
  SELECTED_COLOR_PATTERN: { en: "Colors", ar: "الألوان" },
  PREVIEW_MATERIAL: { en: "Materials", ar: "الخامات" },
  SELECTED_MATERIAL: { en: "Materials", ar: "الخامات" },
  PREVIEW_STYLE: { en: "Style", ar: "النمط" },
  SELECTED_STYLE: { en: "Images", ar: "الصور" },
  PREVIEW_IMAGES: { en: "Review", ar: "المراجعة" },
  SELECTED_IMAGES: { en: "Signature", ar: "التوقيع" },
  PDF_GENERATED: { en: "Done", ar: "تم" },
  SUBMITTED: { en: "Done", ar: "تم" },
};

export function getClientProgress(status) {
  const idx = clientStatusOrder.indexOf(status);
  if (idx < 0) return { percent: 0, step: 0, total: clientStatusOrder.length };
  return {
    percent: Math.round((idx / (clientStatusOrder.length - 1)) * 100),
    step: idx + 1,
    total: clientStatusOrder.length,
    label: clientPhaseLabel[status],
  };
}

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
