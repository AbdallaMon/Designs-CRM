// Mutation runner for course write actions (admin authoring AND staff learner). Wraps a
// coursesService / staffCoursesService call with a toast that resolves the backend message
// CODE → Arabic (§5: NO hardcoded Arabic prose from responses; we resolve the language-neutral
// CODE the envelope carries). Routes through the services (no ad-hoc fetch) and the
// coursesMessages resolver. Returns the parsed envelope on success, or null on failure (after
// toasting the resolved error code). Mirrors calendar.mutations.js / accounting.mutations.js.

import { toast } from "react-toastify";
import { Success, Failed } from "@/app/v2/lib/toast/toastUtils";
import { resolveCoursesMessage } from "./config/coursesMessages.js";

/**
 * @param {() => Promise<object>} fn        a courses/staffCourses service call returning the envelope
 * @param {object} [opts]
 * @param {string} [opts.loading]           loading toast text (Arabic)
 * @param {boolean} [opts.shouldAutoToast]  toast success/error (default true)
 * @param {Function} [opts.setLoading]      optional external loading setter
 */
export async function runCoursesMutation(
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
          resolveCoursesMessage(res?.message, {
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
          resolveCoursesMessage(code, {
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
