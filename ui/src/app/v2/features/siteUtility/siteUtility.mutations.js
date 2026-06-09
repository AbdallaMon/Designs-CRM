// Mutation runner for site-utility write actions. Wraps a siteUtilityService call with a
// toast that resolves the backend message CODE to Arabic. Routes through the service (no
// ad-hoc fetch) and the message-code → Arabic resolver. Returns the parsed envelope (or
// null on failure).

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveSiteUtilityMessage } from "./config/siteUtilityMessages.js";

/**
 * @param {() => Promise<object>} fn       a siteUtilityService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]          loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast] toast success/error (default true)
 * @param {Function} [opts.setLoading]     optional external loading setter
 */
export async function runSiteUtilityMutation(
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
          resolveSiteUtilityMessage(res?.message, {
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
          resolveSiteUtilityMessage(code, {
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
