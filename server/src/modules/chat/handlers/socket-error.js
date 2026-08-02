import {
  generalMessagesCodes,
  messagesNames,
} from "@dms/shared";

export function socketErrorEnvelope(
  error,
  fallbackCode = generalMessagesCodes.UNEXPECTED_ERROR,
) {
  const code =
    typeof error?.code === "string" ? error.code : fallbackCode;

  return {
    success: false,
    message: code,
    code,
    data: null,
    translationKey:
      error?.translationKey ?? messagesNames.chatMessages,
    details: error?.details ?? null,
  };
}
