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

const SUCCESS_FALLBACK = "تمت العملية بنجاح";
const ERROR_FALLBACK = "حدث خطأ، حاول مرة أخرى";

export function Success(message, translationKey) {
  return {
    render: resolveMessageCode(message, {
      translationKey,
      fallback: SUCCESS_FALLBACK,
    }),
    type: "success",
    isLoading: false,
    autoClose: 3000,
  };
}

export function Failed(error, translationKey) {
  return {
    render: resolveMessageCode(error, {
      translationKey,
      fallback: ERROR_FALLBACK,
    }),
    type: "error",
    isLoading: false,
    autoClose: 3000,
  };
}
