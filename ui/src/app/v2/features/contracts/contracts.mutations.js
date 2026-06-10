// Mutation runner for contract write actions (create / cancel / generate-token / stage /
// payment / drawing / special-item CRUD + the public e-sign status/generate-pdf). Wraps a
// contractsService call with a toast that resolves the backend message CODE → Arabic (§5c:
// NO hardcoded Arabic prose from responses; we resolve the language-neutral CODE the envelope
// carries — the BE replaced the legacy Arabic prose with codes). Routes through the service
// (no ad-hoc fetch) and the contractsMessages resolver. Returns the parsed envelope on
// success, or null on failure (after toasting the resolved error code). Mirrors
// calendar.mutations.js / accounting.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveContractMessage } from "./config/contractsMessages.js";

/**
 * @param {() => Promise<object>} fn        a contractsService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runContractMutation(
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
          resolveContractMessage(res?.message, {
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
          resolveContractMessage(code, {
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
