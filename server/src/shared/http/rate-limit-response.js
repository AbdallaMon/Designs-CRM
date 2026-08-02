import { generalMessagesCodes, messagesNames } from "@dms/shared";

export function rateLimitResponse(
  code = generalMessagesCodes.TOO_MANY_REQUESTS,
) {
  return {
    success: false,
    message: code,
    code,
    data: null,
    translationKey: messagesNames.generalMessages,
    details: null,
  };
}
