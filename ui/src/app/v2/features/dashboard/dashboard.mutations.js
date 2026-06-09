// Mutation/action runner for the dashboard domain. The dashboard surface is READ-ONLY (the 9
// aggregations are all GET), so there are no real mutations today — this runner exists for
// contract symmetry with the other features and to give any future dashboard write a single,
// CODE→Arabic-toasting entry point. Wraps a dashboardService call with a toast that resolves
// the backend message CODE → Arabic (§5c: NO hardcoded Arabic prose from responses; we resolve
// the language-neutral CODE the envelope carries). Mirrors calendar.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveDashboardMessage } from "./config/dashboardMessages.js";

/**
 * @param {() => Promise<object>} fn        a dashboardService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runDashboardMutation(
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
          resolveDashboardMessage(res?.message, {
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
          resolveDashboardMessage(code, {
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
