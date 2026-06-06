// Chat data-access service — the ONLY place that talks to the chat API. Wraps the
// canonical apiFetch (config.apiUrl === /v2). Components/hooks call these, never
// fetch/apiFetch directly. All responses share the { success, message, data,
// translationKey } envelope; helpers return the parsed envelope.

import apiFetch, { legacyApiFetch } from "@/app/v2/lib/api/ApiFetch";
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
  // The users module is not migrated to /v2 yet, so the add-members directory still
  // hits the LEGACY base (config.legacyApiUrl): /admin/all-users for admins and
  // /shared/all-related-chat-users (with projectId) for normal users. Legacy returns
  // the user array directly under response.data.
  // TODO: switch to /v2/users when users module migrates.
  listDirectoryUsers: ({ isAdmin = false, projectId = null } = {}) => {
    const base = isAdmin ? "admin/all-users" : "shared/all-related-chat-users";
    return legacyApiFetch.get(
      withQuery(base, isAdmin ? {} : { projectId }),
    );
  },
};

export default chatService;
