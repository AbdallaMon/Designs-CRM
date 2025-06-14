import { toast } from "react-toastify";
import {
  Failed,
  Success,
} from "@/app/UiComponents/feedback/loaders/toast/ToastUpdate";

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
      toast.update(id, Failed(response.message));
    }
    return response;
  } catch (err) {
    toast.update(id, Failed("Error, " + err.message));
    return { status: 500, message: "Error, " + err.message };
  } finally {
    setLoading(false);
  }
}
