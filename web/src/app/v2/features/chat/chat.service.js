// Chat data-access service — the ONLY place that talks to the chat API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these, never
// fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.

import apiFetch from "@/app/v2/lib/api/ApiFetch";
import {
  CHAT_ROOMS_URL,
  chatRoomUrl,
  CHAT_CREATE_CHAT_URL,
  CHAT_LEAD_ROOMS_URL,
  chatRoomSettingsUrl,
  chatManageClientUrl,
  chatRegenerateTokenUrl,
  chatMessagesUrl,
  chatMessagePageUrl,
  chatPinnedMessagesUrl,
  CHAT_READ_ALL_URL,
  chatReadRoomUrl,
  chatReactionsUrl,
  chatReactionUrl,
  chatMembersUrl,
  chatMemberUrl,
  chatFilesUrl,
  chatFilesStatsUrl,
  CHAT_DIRECTORY_URL,
  clientValidateTokenUrl,
  clientRoomUrl,
  clientMembersUrl,
  clientFilesUrl,
  clientMessagesUrl,
  clientMessagePageUrl,
  clientPinnedMessagesUrl,
} from "./config/constant.js";

function withQuery(base, params = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return base;
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return base.includes("?") ? `${base}&${qs}` : `${base}?${qs}`;
}

// ── Rooms ──────────────────────────────────────────────────────────────────────
export const chatService = {
  listRooms: (params = {}) => apiFetch.get(withQuery(CHAT_ROOMS_URL, params)),
  getRoom: (roomId, params = {}) =>
    apiFetch.get(withQuery(chatRoomUrl(roomId), params)),
  createRoom: (body) => apiFetch.post(CHAT_ROOMS_URL, body),
  createChat: (body) => apiFetch.post(CHAT_CREATE_CHAT_URL, body),
  createLeadRoom: (body) => apiFetch.post(CHAT_LEAD_ROOMS_URL, body),
  updateRoom: (roomId, body) => apiFetch.put(chatRoomUrl(roomId), body),
  updateRoomSettings: (roomId, body) =>
    apiFetch.put(chatRoomSettingsUrl(roomId), body),
  deleteRoom: (roomId) => apiFetch.delete(chatRoomUrl(roomId)),
  manageClient: (roomId, body) => apiFetch.post(chatManageClientUrl(roomId), body),
  regenerateToken: (roomId) => apiFetch.post(chatRegenerateTokenUrl(roomId)),

  // ── Messages (cursor / scroll-back pagination — page+limit kept from legacy) ──
  listMessages: (roomId, params = {}) =>
    apiFetch.get(withQuery(chatMessagesUrl(roomId), params)),
  getMessagePage: (roomId, messageId, params = {}) =>
    apiFetch.get(withQuery(chatMessagePageUrl(roomId, messageId), params)),
  listPinnedMessages: (roomId, params = {}) =>
    apiFetch.get(withQuery(chatPinnedMessagesUrl(roomId), params)),
  readAll: (body) => apiFetch.post(CHAT_READ_ALL_URL, body),
  readRoom: (roomId, body) => apiFetch.post(chatReadRoomUrl(roomId), body),
  addReaction: (messageId, body) => apiFetch.post(chatReactionsUrl(messageId), body),
  removeReaction: (messageId, emoji) =>
    apiFetch.delete(chatReactionUrl(messageId, emoji)),

  // ── Members ──────────────────────────────────────────────────────────────────
  listMembers: (roomId, params = {}) =>
    apiFetch.get(withQuery(chatMembersUrl(roomId), params)),
  addMembers: (roomId, body) => apiFetch.post(chatMembersUrl(roomId), body),
  updateMember: (roomId, memberId, body) =>
    apiFetch.put(chatMemberUrl(roomId, memberId), body),
  removeMember: (roomId, memberId) =>
    apiFetch.delete(chatMemberUrl(roomId, memberId)),

  // ── Files ──────────────────────────────────────────────────────────────────
  listFiles: (roomId, params = {}) =>
    apiFetch.get(withQuery(chatFilesUrl(roomId), params)),
  filesStats: (roomId) => apiFetch.get(chatFilesStatsUrl(roomId)),

  // ── User directory (add-members) ─────────────────────────────────────────────
  // v2 endpoint GET /v2/users/chat-directory: admin → all users, non-admin → related
  // users. Returns { success, data:[...users] }. projectId is forwarded as a query
  // param (accepted-but-unused server-side, mirrors legacy). The server scopes by the
  // authed caller's role, so no isAdmin flag is needed on the request.
  listDirectoryUsers: ({ projectId = null } = {}) =>
    apiFetch.get(withQuery(CHAT_DIRECTORY_URL, { projectId })),
};

// ── Public client chat service ───────────────────────────────────────────────────
// Token-based reads against /v2/client/chat/* via apiFetch.public (no auth/refresh).
// Every call carries ?token=. The BE resolves the room FROM the token and rejects any
// :roomId that differs (IDOR close), so the token is the only credential that matters.
// Sends/edits/deletes go over the shared v2 socket (chat.socket), not HTTP — identical
// to the staff flow; the client surface is read-only over REST.
export const clientChatService = {
  validateToken: (token) =>
    apiFetch.public.get(withQuery(clientValidateTokenUrl(), { token })),
  getRoom: (roomId, token, params = {}) =>
    apiFetch.public.get(withQuery(clientRoomUrl(roomId), { token, ...params })),
  listMembers: (roomId, token, params = {}) =>
    apiFetch.public.get(withQuery(clientMembersUrl(roomId), { token, ...params })),
  listFiles: (roomId, token, params = {}) =>
    apiFetch.public.get(withQuery(clientFilesUrl(roomId), { token, ...params })),
  listMessages: (roomId, token, params = {}) =>
    apiFetch.public.get(withQuery(clientMessagesUrl(roomId), { token, ...params })),
  getMessagePage: (roomId, messageId, token, params = {}) =>
    apiFetch.public.get(
      withQuery(clientMessagePageUrl(roomId, messageId), { token, ...params }),
    ),
  listPinnedMessages: (roomId, token, params = {}) =>
    apiFetch.public.get(
      withQuery(clientPinnedMessagesUrl(roomId), { token, ...params }),
    ),
};

export default chatService;
