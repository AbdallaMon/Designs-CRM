// Chat feature — API contract surface. All paths are relative to the v2 API base
// (apiFetch is configured with config.apiUrl === /v2). Keep these in one place so a
// backend path change is a one-line edit (migration plan §11 reconciliation point).

export const CHAT_BASE = "chat";

// ── Rooms ──────────────────────────────────────────────────────────────────────
export const CHAT_ROOMS_URL = `${CHAT_BASE}/rooms`;
export const chatRoomUrl = (roomId) => `${CHAT_BASE}/rooms/${roomId}`;
export const CHAT_CREATE_CHAT_URL = `${CHAT_BASE}/rooms/create-chat`;
export const CHAT_LEAD_ROOMS_URL = `${CHAT_BASE}/rooms/lead-rooms`;
export const chatRoomSettingsUrl = (roomId) =>
  `${CHAT_BASE}/rooms/${roomId}/update-room-settings`;
export const chatManageClientUrl = (roomId) =>
  `${CHAT_BASE}/rooms/${roomId}/manageClient`;
export const chatRegenerateTokenUrl = (roomId) =>
  `${CHAT_BASE}/rooms/${roomId}/regenerateToken`;

// ── Messages ─────────────────────────────────────────────────────────────────
export const chatMessagesUrl = (roomId) => `${CHAT_BASE}/rooms/${roomId}/messages`;
export const chatMessagePageUrl = (roomId, messageId) =>
  `${CHAT_BASE}/rooms/${roomId}/messages/${messageId}/page`;
export const chatPinnedMessagesUrl = (roomId) =>
  `${CHAT_BASE}/rooms/${roomId}/pinned-messages`;
export const CHAT_READ_ALL_URL = `${CHAT_BASE}/rooms/read-all`;
export const chatReadRoomUrl = (roomId) => `${CHAT_BASE}/rooms/${roomId}/read`;
export const chatReactionsUrl = (messageId) =>
  `${CHAT_BASE}/messages/${messageId}/reactions`;
export const chatReactionUrl = (messageId, emoji) =>
  `${CHAT_BASE}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`;

// ── Members ──────────────────────────────────────────────────────────────────
export const chatMembersUrl = (roomId) => `${CHAT_BASE}/rooms/${roomId}/members`;
export const chatMemberUrl = (roomId, memberId) =>
  `${CHAT_BASE}/rooms/${roomId}/members/${memberId}`;

// ── Files ────────────────────────────────────────────────────────────────────
export const chatFilesUrl = (roomId) => `${CHAT_BASE}/rooms/${roomId}/files`;
export const chatFilesStatsUrl = (roomId) =>
  `${CHAT_BASE}/rooms/${roomId}/files/stats`;

// ── Public client surface (token-based) ────────────────────────────────────────
// The public client chat resolves to /v2/client/chat/* (apiFetch base is /v2). Every
// read is authenticated by the per-room ?token=. Paths mirror the staff routes under a
// `client/chat` prefix (server/src/modules/chat/client/client-chat.route.js).
export const CLIENT_CHAT_BASE = "client/chat";
export const clientValidateTokenUrl = () => `${CLIENT_CHAT_BASE}/rooms/validate-token`;
export const clientRoomUrl = (roomId) => `${CLIENT_CHAT_BASE}/rooms/${roomId}`;
export const clientMembersUrl = (roomId) =>
  `${CLIENT_CHAT_BASE}/rooms/${roomId}/members`;
export const clientFilesUrl = (roomId) => `${CLIENT_CHAT_BASE}/rooms/${roomId}/files`;
export const clientMessagesUrl = (roomId) =>
  `${CLIENT_CHAT_BASE}/${roomId}/messages`;
export const clientMessagePageUrl = (roomId, messageId) =>
  `${CLIENT_CHAT_BASE}/${roomId}/messages/${messageId}/page`;
export const clientPinnedMessagesUrl = (roomId) =>
  `${CLIENT_CHAT_BASE}/${roomId}/pinned-messages`;

// ── User directory (add-members) ───────────────────────────────────────────────
// v2 users module. GET /v2/users/chat-directory — admin → all users, non-admin →
// related users. Returns { success, data:[...users] }. Optional ?projectId is
// accepted-but-unused server-side (mirrors legacy). Replaces the legacy
// /admin/all-users + /shared/all-related-chat-users pair.
export const CHAT_DIRECTORY_URL = "users/chat-directory";
