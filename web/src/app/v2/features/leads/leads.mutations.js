// Mutation runner for leads write actions. Wraps a leadsService call with a toast that
// resolves the backend message CODE → Arabic (§5c: NO hardcoded Arabic prose from
// responses; we resolve the language-neutral CODE the envelope carries). Routes through
// the service (no ad-hoc fetch) and the leadsMessages resolver. Returns the parsed
// envelope on success, or null on failure (after toasting the resolved error code).
// Mirrors features/siteUtility/siteUtility.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveLeadMessage } from "./config/leadsMessages.js";

/**
 * @param {() => Promise<object>} fn        a leadsService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runLeadMutation(
  fn,
  { loading = "جاري التنفيذ...", shouldAutoToast = true, setLoading } = {},
) {
  const toastId = shouldAutoToast ? toast.loading(loading) : null;
  setLoading?.(true);
  try {
    const res = await fn();
    if (shouldAutoToast) {
      toast.update(toastId, Success(resolveLeadMessage(res?.message)));
    }
    return res;
  } catch (e) {
    const code = e?.data?.message || e?.message;
    if (shouldAutoToast) {
      toast.update(
        toastId,
        Failed(resolveLeadMessage(code, { fallback: "حدث خطأ، حاول مرة أخرى" })),
      );
    }
    return null;
  } finally {
    setLoading?.(false);
  }
}
