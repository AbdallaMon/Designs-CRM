import { toast } from "react-toastify";
import { Failed, Success } from "@/app/v2/lib/toast/toastUtils";
import apiFetch from "./ApiFetch";

export async function handleRequestSubmit({
  data,
  setLoading,
  path,
  isFileUpload = false,
  toastMessage = "Sending...",
  setRedirect,
  method = "POST",
  header,
}) {
  const toastId = toast.loading(toastMessage);
  setLoading(true);

  try {
    const response = await apiFetch.submit(
      method,
      path,
      data,
      isFileUpload,
      header,
    );

    if (response.status === 200) {
      toast.update(toastId, Success(response.message, response.translationKey));
      if (setRedirect) setRedirect((prev) => !prev);
    } else {
      toast.update(toastId, Failed(response.message, response.translationKey));
    }

    return response;
  } catch (err) {
    // err.message / err.data.message is the language-neutral CODE thrown by ApiFetch;
    // pass the BARE code (no "Error, " prefix) so the toast layer resolves it to Arabic.
    const code = err?.data?.message || err?.message || "UNKNOWN_ERROR";
    toast.update(toastId, Failed(code, err?.data?.translationKey));
    return { status: 500, message: code };
  } finally {
    setLoading(false);
  }
}
