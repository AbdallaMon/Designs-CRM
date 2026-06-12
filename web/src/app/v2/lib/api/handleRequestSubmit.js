import { toast } from "react-toastify";
import { Failed, Success } from "@/app/v2/lib/toast/toastUtils";
import { resolveMessage } from "@/app/v2/lib/messages/resolveMessage";
import apiFetch, { legacyApiFetch } from "./ApiFetch";

export async function handleRequestSubmit({
  data,
  setLoading,
  path,
  isFileUpload = false,
  toastMessage = "Sending...",
  setRedirect,
  method = "POST",
  header,
  legacy = false,
}) {
  const toastId = toast.loading(toastMessage);
  setLoading(true);

  try {
    const response = await (legacy ? legacyApiFetch : apiFetch).submit(
      method,
      path,
      data,
      isFileUpload,
      header,
    );

    if (response.status === 200) {
      toast.update(toastId, Success(resolveMessage(response.message)));
      if (setRedirect) setRedirect((prev) => !prev);
    } else {
      toast.update(toastId, Failed(resolveMessage(response.message)));
    }

    return response;
  } catch (err) {
    const message = resolveMessage(err?.data?.message || err?.message);
    toast.update(toastId, Failed(message));
    return { status: 500, message };
  } finally {
    setLoading(false);
  }
}
