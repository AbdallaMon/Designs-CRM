// Mutation runner for admin-residual write actions (lead import/create/update/delete, client
// update, telegram, fixed-data writes, commission create/update, project-group create, model
// archive). Wraps an adminResidualService call with a toast that resolves the backend message
// CODE → Arabic (NO hardcoded Arabic prose from responses; we resolve the language-neutral CODE
// the envelope carries). Routes through the service (no ad-hoc fetch) and the
// adminResidualMessages resolver. Returns the parsed envelope on success, or null on failure
// (after toasting the resolved error code). Mirrors calendar.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveAdminResidualMessage } from "./config/adminResidualMessages.js";

/**
 * @param {() => Promise<object>} fn        an adminResidualService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runAdminResidualMutation(
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
          resolveAdminResidualMessage(res?.message, {
            translationKey: res?.translationKey,
            fallback: "تمت العملية",
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
          resolveAdminResidualMessage(code, {
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
