/**
 * Toast update config objects for react-toastify.
 * v2-native — no imports from old UiComponents.
 *
 * CENTRAL CODE → Arabic resolution lives HERE: every toast (the generic
 * handleRequestSubmit path, apiFetch/useRequest error surfaces, and the per-feature
 * mutation runners) flows through Success()/Failed(), so we resolve the language-neutral
 * backend CODE to Arabic at this single chokepoint. resolveMessageCode is mixed-input
 * safe — a raw CODE becomes Arabic, an unknown CODE becomes the fallback, and already
 * Arabic / free text passes through UNCHANGED, so double-resolution (the feature runners
 * already resolve) is harmless.
 */

import { resolveMessageCode } from "@/app/v2/data/resolveMessageCode";
import { getCurrentLang } from "@/app/v2/lib/i18n/langRuntime";

// BILINGUAL (Phase 1): the toast layer runs OUTSIDE the React tree, so it can't call useT(). It
// reads the current language from the module-level langRuntime holder (kept in sync by the
// I18nProvider). Default is "ar" until the provider mounts, so ar toasts are byte-identical to
// before. The fallbacks are chosen per language too.
const SUCCESS_FALLBACK_AR = "تمت العملية بنجاح";
const SUCCESS_FALLBACK_EN = "Done successfully";
const ERROR_FALLBACK_AR = "حدث خطأ، حاول مرة أخرى";
const ERROR_FALLBACK_EN = "Something went wrong, please try again";

export function Success(message, translationKey) {
  const lang = getCurrentLang();
  return {
    render: resolveMessageCode(message, {
      translationKey,
      lang,
      fallback: lang === "en" ? SUCCESS_FALLBACK_EN : SUCCESS_FALLBACK_AR,
    }),
    type: "success",
    isLoading: false,
    autoClose: 3000,
  };
}

export function Failed(error, translationKey) {
  const lang = getCurrentLang();
  return {
    render: resolveMessageCode(error, {
      translationKey,
      lang,
      fallback: lang === "en" ? ERROR_FALLBACK_EN : ERROR_FALLBACK_AR,
    }),
    type: "error",
    isLoading: false,
    autoClose: 3000,
  };
}
