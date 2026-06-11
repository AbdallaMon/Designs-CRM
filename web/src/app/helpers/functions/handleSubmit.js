import { toast } from "react-toastify";
import {
  Failed,
  Success,
} from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";
import { handleRequestSubmit as handleRequestSubmitV2 } from "../../v2/lib/api/handleRequestSubmit";
export async function handleRequestSubmit(
  data,
  setLoading,
  path,
  isFileUpload = false,
  toastMessage = "Sending...",
  setRedirect,
  method = "POST",
  header,
) {
  return await handleRequestSubmitV2({
    data,
    setLoading,
    path,
    isFileUpload,
    toastMessage,
    setRedirect,
    method,
    header,
    legacy: true,
  });

  const toastId = toast.loading(toastMessage);
  const body = isFileUpload ? data : JSON.stringify(data);
  const headers = header
    ? { "Content-Type": header }
    : isFileUpload
      ? {}
      : { "Content-Type": "application/json" };
  setLoading(true);
  const id = toastId;
  try {
    const request = await fetch(process.env.NEXT_PUBLIC_URL + "/" + path, {
      method: method,
      body,
      headers: headers,
      credentials: "include",
    });
    const reqStatus = request.status;
    const response = await request.json();
    response.status = reqStatus;
    if (reqStatus === 200) {
      await toast.update(id, Success(response.message));
      if (setRedirect) {
        setRedirect((prev) => !prev);
      }
    } else {
      if (
        response?.success === false ||
        reqStatus === 401 ||
        reqStatus === 403 ||
        reqStatus === 419 ||
        reqStatus === 440 ||
        reqStatus === 498 ||
        reqStatus === 400
      ) {
        const error = new Error(response.message);
        error.status = reqStatus;
        throw error;
      }
      toast.update(id, Failed(response.message));
    }
    return response;
  } catch (err) {
    console.log(err, "err");
    toast.update(id, Failed("Error, " + err.message));
    return { status: err.status || 500, message: err.message };
  } finally {
    setLoading(false);
  }
}
