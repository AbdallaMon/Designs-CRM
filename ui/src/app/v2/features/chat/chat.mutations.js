// Mutation runner for chat write actions. Wraps a chatService call with a toast that
// resolves the backend message CODE to Arabic. Mirrors handleRequestSubmit's UX
// (loading → success/error toast) but routes through chatService (no ad-hoc fetch) and
// the message-code → Arabic resolver. Returns the parsed envelope (or null on failure).

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveChatMessage } from "./config/chatMessages.js";

/**
 * @param {() => Promise<object>} fn       a chatService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]          loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast] toast success/error (default true)
 * @param {Function} [opts.setLoading]     optional external loading setter
 */
export async function runChatMutation(
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
          resolveChatMessage(res?.message, {
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
          resolveChatMessage(code, {
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
