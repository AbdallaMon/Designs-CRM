// Mutation runner for calendar write actions (availability create/delete, Google connect/
// disconnect, public booking). Wraps a calendarService call with a toast that resolves the
// backend message CODE → Arabic (§5c: NO hardcoded Arabic prose from responses; we resolve
// the language-neutral CODE the envelope carries). Routes through the service (no ad-hoc
// fetch) and the calendarMessages resolver. Returns the parsed envelope on success, or null
// on failure (after toasting the resolved error code). Mirrors accounting.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveCalendarMessage } from "./config/calendarMessages.js";

/**
 * @param {() => Promise<object>} fn        a calendarService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runCalendarMutation(
  fn,
  { loading = "جاري التنفيذ...", shouldAutoToast = true, setLoading } = {},
) {
  const toastId = shouldAutoToast ? toast.loading(loading) : null;
  setLoading?.(true);
  try {
    const res = await fn();
    if (shouldAutoToast) {
      toast.update(toastId, Success(resolveCalendarMessage(res?.message)));
    }
    return res;
  } catch (e) {
    const code = e?.data?.message || e?.message;
    if (shouldAutoToast) {
      toast.update(
        toastId,
        Failed(resolveCalendarMessage(code, { fallback: "حدث خطأ، حاول مرة أخرى" })),
      );
    }
    return null;
  } finally {
    setLoading?.(false);
  }
}
