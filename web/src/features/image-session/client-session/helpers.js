import { IMAGE_SESSION_STATUSES } from "@dms/shared";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

// --- Static-catalog cache -------------------------------------------------
// Colors / materials / styles / page-info are read-only lookups that don't
// change during a client session. Without caching, every Back/Next (and every
// language toggle) re-downloads them — costly on mobile data and it flashes a
// full-screen loader each time. We memoize by URL (which already encodes lng),
// so a revisited step renders instantly with no loader flash. The cache lives
// for the lifetime of the SPA session and resets on a hard reload.
const stepDataCache = new Map();
const STEP_CACHE_TTL_MS = 45 * 60 * 1000;

export async function getCachedStepData({ url, setData, setLoading }) {
  const cached = stepDataCache.get(url);
  if (cached?.expiresAt > Date.now()) {
    setData(cached.data);
    setLoading?.(false);
    return;
  }
  stepDataCache.delete(url);
  await getDataAndSet({
    url,
    setLoading,
    setData: (data) => {
      stepDataCache.set(url, {
        data,
        expiresAt: Date.now() + STEP_CACHE_TTL_MS,
      });
      setData(data);
    },
  });
}

export const sessionStatusFlow = {
  INITIAL: {
    next: IMAGE_SESSION_STATUSES.PREVIEW_COLOR_PATTERN,
    back: null,
  },
  PREVIEW_COLOR_PATTERN: {
    next: IMAGE_SESSION_STATUSES.SELECTED_COLOR_PATTERN,
    back: IMAGE_SESSION_STATUSES.INITIAL,
  },
  SELECTED_COLOR_PATTERN: {
    next: IMAGE_SESSION_STATUSES.PREVIEW_MATERIAL,
    back: IMAGE_SESSION_STATUSES.PREVIEW_COLOR_PATTERN,
  },
  PREVIEW_MATERIAL: {
    next: IMAGE_SESSION_STATUSES.SELECTED_MATERIAL,
    back: IMAGE_SESSION_STATUSES.SELECTED_COLOR_PATTERN,
  },
  SELECTED_MATERIAL: {
    next: IMAGE_SESSION_STATUSES.PREVIEW_STYLE,
    back: IMAGE_SESSION_STATUSES.PREVIEW_MATERIAL,
  },
  PREVIEW_STYLE: {
    next: IMAGE_SESSION_STATUSES.SELECTED_STYLE,
    back: IMAGE_SESSION_STATUSES.SELECTED_MATERIAL,
  },
  SELECTED_STYLE: {
    next: IMAGE_SESSION_STATUSES.PREVIEW_IMAGES,
    back: IMAGE_SESSION_STATUSES.PREVIEW_STYLE,
  },
  PREVIEW_IMAGES: {
    next: IMAGE_SESSION_STATUSES.SELECTED_IMAGES,
    back: IMAGE_SESSION_STATUSES.SELECTED_STYLE,
  },
  SELECTED_IMAGES: {
    next: IMAGE_SESSION_STATUSES.PDF_GENERATED,
    back: IMAGE_SESSION_STATUSES.PREVIEW_IMAGES,
  },
  PDF_GENERATED: {
    next: IMAGE_SESSION_STATUSES.SUBMITTED,
    back: IMAGE_SESSION_STATUSES.SELECTED_IMAGES,
  },
  SUBMITTED: {
    next: null,
    back: IMAGE_SESSION_STATUSES.PDF_GENERATED,
  },
};
