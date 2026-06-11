import { toast } from "react-toastify";
import { Failed, Success } from "@/app/v2/lib/toast/toastUtils";
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
      toast.update(toastId, Success(response.message));
      if (setRedirect) setRedirect((prev) => !prev);
    } else {
      toast.update(toastId, Failed(response.message));
    }

    return response;
  } catch (err) {
    toast.update(toastId, Failed("Error, " + err.message));
    return { status: 500, message: "Error, " + err.message };
  } finally {
    setLoading(false);
  }
}
