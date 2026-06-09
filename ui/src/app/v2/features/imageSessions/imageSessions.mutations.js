// Mutation runner for image-session write actions across all three surfaces (admin reference
// CRUD / shared lead-scoped session CRUD / public client saves + generate-pdf). Wraps an
// imageSessionsService call with a toast that resolves the backend message CODE → Arabic (the
// BE replaced the legacy Arabic prose with language-neutral CODES; we resolve back to Arabic
// here). Routes through the service (no ad-hoc fetch) and the imageSessionsMessages resolver.
// Returns the parsed envelope on success, or null on failure (after toasting the resolved
// error code). Mirrors contracts.mutations.js / calendar.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveImageSessionMessage } from "./config/imageSessionsMessages.js";

/**
 * @param {() => Promise<object>} fn        an imageSessionsService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runImageSessionMutation(
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
          resolveImageSessionMessage(res?.message, {
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
          resolveImageSessionMessage(code, {
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
