// Single-language (Arabic) resolution for backend message CODES emitted by the chat
// API ({ success, message: CODE, translationKey }). The backend stays language-neutral;
// this is the FE lookup (migration plan §4/§5 — message-code indirection kept,
// second language dropped). Unknown codes fall back to a generic Arabic string.

export const chatMessages = {
  // rooms
  CHAT_ROOM_CREATED: "Chat created",
  CHAT_ROOM_UPDATED: "Chat updated",
  CHAT_ROOM_DELETED: "Chat deleted",
  CHAT_ROOM_NOT_FOUND: "Chat not found",
  CHAT_ROOM_SETTINGS_UPDATED: "Chat settings updated",
  CHAT_TOKEN_REGENERATED: "Access link regenerated",
  CHAT_CLIENT_UPDATED: "Client updated in chat",
  // members
  CHAT_MEMBERS_ADDED: "Members added",
  CHAT_MEMBER_REMOVED: "Member removed",
  CHAT_MEMBER_UPDATED: "Member updated",
  // messages
  CHAT_MESSAGES_READ: "Messages marked as read",
  CHAT_REACTION_ADDED: "Reaction added",
  CHAT_REACTION_REMOVED: "Reaction removed",
  // generic
  OK: "Operation completed successfully",
  FORBIDDEN: "You do not have permission to perform this action",
  ACCESS_DENIED: "You do not have access",
  VALIDATION_ERROR: "Invalid data",
};

/**
 * Resolve a backend message CODE to an Arabic display string. Falls back to a
 * sensible default rather than showing the raw code to end users.
 * @param {string} code
 * @param {{ fallback?: string }} [opts]
 */
export function resolveChatMessage(code, { fallback } = {}) {
  if (code && chatMessages[code]) return chatMessages[code];
  return fallback ?? "Operation completed";
}
