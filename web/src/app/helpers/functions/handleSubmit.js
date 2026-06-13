import { toast } from "react-toastify";
import {
  Failed,
  Success,
} from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";
import { apiRequest } from "./apiClient";
import { resolveMessage } from "@/app/helpers/messages/resolveMessage";

// Mutating request against the /v2 backend. The backend returns a language-neutral CODE in
// `message` (e.g. LOGIN_SUCCESS / INVALID_CREDENTIALS), so the toast text is resolved to an
// Arabic display string here. The full envelope (incl. `data`) is returned to the caller —
// callers read the payload under `response.data.*`.
export async function handleRequestSubmit(
  data,
  setLoading,
  path,
  isFileUpload = false,
  toastMessage = "Sending...",
  setRedirect,
  method = "POST",
  header
) {
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
    const request = await apiRequest(path, { method, body, headers });
    const reqStatus = request.status;
    let response;
    try {
      response = await request.json();
    } catch {
      response = { message: request.statusText };
    }
    response.status = reqStatus;
    const ok = request.ok || response?.success === true;
    if (ok) {
      await toast.update(
        id,
        Success(resolveMessage(response.message, { fallback: "تمت العملية" }))
      );
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
        reqStatus === 400 ||
        reqStatus === 422
      ) {
        const error = new Error(resolveMessage(response.message));
        error.status = reqStatus;
        throw error;
      }
      toast.update(id, Failed(resolveMessage(response.message)));
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
