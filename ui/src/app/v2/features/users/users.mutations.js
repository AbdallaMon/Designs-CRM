// Mutation runner for users write actions (create/update/status/roles/restricted-countries/
// auto-assignments/max-leads/staff-extra/profile-edit). Wraps a usersService call with a toast
// that resolves the backend message CODE → Arabic (§5c: NO hardcoded Arabic prose from
// responses; we resolve the language-neutral CODE the envelope carries). Routes through the
// service (no ad-hoc fetch) and the usersMessages resolver. Returns the parsed envelope on
// success, or null on failure (after toasting the resolved error code). Mirrors
// features/calendar/calendar.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveUsersMessage } from "./config/usersMessages.js";

/**
 * @param {() => Promise<object>} fn        a usersService call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runUsersMutation(
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
          resolveUsersMessage(res?.message, {
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
          resolveUsersMessage(code, {
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
