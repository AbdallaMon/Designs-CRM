// English mirror of the CHAT message CODES (namespace "chatMessages").
// CODE → English. Mirrors keys 1:1 with ../chat.js (the Arabic map). Bilingual Phase 1.

export const chatMessagesEn = {
  // ── reads / generic ──────────────────────────────────────────────────────────
  ROOMS_FETCHED: "Chats retrieved",
  ROOM_FETCHED: "Chat retrieved",
  MESSAGES_FETCHED: "Messages retrieved",
  MESSAGE_PAGE_FETCHED: "Messages retrieved",
  PINNED_MESSAGES_FETCHED: "Pinned messages retrieved",
  MEMBERS_FETCHED: "Members retrieved",
  FILES_FETCHED: "Files retrieved",
  FILE_STATS_FETCHED: "File statistics retrieved",
  REACTION_ADDED: "Reaction added",
  MEMBER_ROLE_UPDATED: "Member role updated",

  // ── public client (token-based) surface ───────────────────────────────────────
  ROOM_TOKEN_VALIDATED: "Chat link verified",
  INVALID_ROOM_TOKEN: "Invalid chat link",

  // ── success / mutations ──────────────────────────────────────────────────────
  ROOM_CREATED: "Chat created",
  LEAD_ROOM_CREATED: "Client chat created",
  ROOM_UPDATED: "Chat updated",
  ROOM_DELETED: "Chat deleted",
  TOKEN_REGENERATED: "Access link regenerated",
  CLIENT_ADDED: "Client added to the chat",
  CLIENT_REMOVED: "Client removed from the chat",
  MESSAGES_MARKED_READ: "Messages marked as read",
  ALL_ROOMS_MARKED_READ: "All chats marked as read",
  REACTION_REMOVED: "Reaction removed",
  MEMBERS_ADDED: "Members added",
  MEMBER_REMOVED: "Member removed",
  MESSAGE_DELETED: "Message deleted",

  // ── errors / scope / guards ──────────────────────────────────────────────────
  ROOM_NOT_FOUND: "Chat not found",
  ROOM_ACCESS_DENIED: "You don't have permission to access this chat",
  ROOM_FORBIDDEN_ACTION: "You don't have permission to perform this action in the chat",
  MESSAGE_NOT_FOUND: "Message not found",
  MESSAGE_FORBIDDEN: "You can only edit/delete your own messages",
  REACTION_NOT_FOUND: "Reaction not found",
  MEMBER_NOT_FOUND: "Member not found",
  CLIENT_LEAD_NOT_FOUND: "Client not found",
  NO_CLIENT_LEAD_ON_ROOM: "No client is linked to this chat",
  NO_PROJECTS_FOR_CRITERIA: "No matching projects",
  ROOM_NOT_DELETABLE: "This chat can't be deleted",
  CHAT_DISABLED: "Chat is disabled",
  FILES_DISABLED: "File sharing is disabled",
  INVALID_MEMBER_ROLE: "Invalid member role",
  INVALID_MANAGE_CLIENT_ACTION: "Invalid manage-client action",
};
