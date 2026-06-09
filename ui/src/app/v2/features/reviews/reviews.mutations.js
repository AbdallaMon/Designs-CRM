// Mutation runner for reviews actions. The reviews surface is read-only from the FE (the two
// REVIEW.VIEW reads + a browser-redirect OAuth connect that carries no FE mutation), so this
// runner exists for parity/consistency with the other features and to toast any
// reviewsService call that returns the envelope. Wraps the call with a toast that resolves the
// backend message CODE → Arabic (NO hardcoded Arabic prose from responses). Returns the parsed
// envelope on success, or null on failure. Mirrors calendar.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveReviewsMessage } from "./config/reviewsMessages.js";

/**
 * @param {() => Promise<object>} fn        a reviewsService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runReviewsMutation(
  fn,
  { loading = "جاري التنفيذ...", shouldAutoToast = true, setLoading } = {},
) {
  const toastId = shouldAutoToast ? toast.loading(loading) : null;
  setLoading?.(true);
  try {
    const res = await fn();
    if (shouldAutoToast) {
      toast.update(
        toastId,
        Success(
          resolveReviewsMessage(res?.message, {
            translationKey: res?.translationKey,
          }),
        ),
      );
    }
    return res;
  } catch (e) {
    const code = e?.data?.message || e?.message;
    if (shouldAutoToast) {
      toast.update(
        toastId,
        Failed(
          resolveReviewsMessage(code, {
            translationKey: e?.data?.translationKey,
            fallback: "حدث خطأ، حاول مرة أخرى",
          }),
        ),
      );
    }
    return null;
  } finally {
    setLoading?.(false);
  }
}
