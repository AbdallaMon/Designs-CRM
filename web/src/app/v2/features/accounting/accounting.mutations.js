// Mutation runner for accounting write actions. Wraps an accountingService call with a
// toast that resolves the backend message CODE → Arabic (§5c: NO hardcoded Arabic prose
// from responses; we resolve the language-neutral CODE the envelope carries). Routes
// through the service (no ad-hoc fetch) and the accountingMessages resolver. Returns the
// parsed envelope on success, or null on failure (after toasting the resolved error code).
// Mirrors features/projects/projects.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveAccountingMessage } from "./config/accountingMessages.js";

/**
 * @param {() => Promise<object>} fn        an accountingService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runAccountingMutation(
  fn,
  { loading = "جاري التنفيذ...", shouldAutoToast = true, setLoading } = {},
) {
  const toastId = shouldAutoToast ? toast.loading(loading) : null;
  setLoading?.(true);
  try {
    const res = await fn();
    if (shouldAutoToast) {
      toast.update(toastId, Success(resolveAccountingMessage(res?.message)));
    }
    return res;
  } catch (e) {
    const code = e?.data?.message || e?.message;
    if (shouldAutoToast) {
      toast.update(
        toastId,
        Failed(resolveAccountingMessage(code, { fallback: "حدث خطأ، حاول مرة أخرى" })),
      );
    }
    return null;
  } finally {
    setLoading?.(false);
  }
}
