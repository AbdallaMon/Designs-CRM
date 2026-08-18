import { USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";

import { resolveMessage } from "../../../app/helpers/messages/resolveMessage.js";

export function getSlotSelectionErrorMessage(response) {
  if (typeof response?.error === "string" && response.error) {
    return response.error;
  }
  if (typeof response?.error?.message === "string" && response.error.message) {
    return response.error.message;
  }
  return resolveMessage(response?.message, {
    fallback: FEEDBACK.SLOT_DETAILS_LOAD_FAILED,
  });
}
