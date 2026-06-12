import { CHAT_ROOM_TYPE_LABELS, CHAT_ROOM_TYPE_LABEL_KEYS } from "./config/chatConstants.js";

// Resolve a label via the passed translator if present, else the Arabic fallback. `t` is
// the i18n translator (key, fallback) — only available when a React caller passes it.
const tr = (t, key, fallback) => (typeof t === "function" ? t(key, fallback) : fallback);

const roomTypeLabel = (type, t) =>
  tr(t, CHAT_ROOM_TYPE_LABEL_KEYS[type], CHAT_ROOM_TYPE_LABELS[type]);

export const getRoomAvatar = (room) => {
  if (!room) return null;
  if (room.avatarUrl) return room.avatarUrl;
  if (room.type === "STAFF_TO_STAFF") {
    const otherMember = room.otherMembers?.[0];
    return otherMember?.user?.profilePicture || otherMember?.client?.profilePicture;
  }
  return room.name?.charAt(0);
};

// `t` (optional) — the i18n translator from a React caller. Without it, Arabic fallbacks
// are returned verbatim (legacy/non-React callers), so behavior is unchanged.
export const getRoomLabel = (room, t) => {
  if (!room) return tr(t, "chat.util.loading", "جاري التحميل...");
  if (room.type === "STAFF_TO_STAFF") {
    const otherMember = room.otherMembers?.[0];
    if (otherMember?.user) return otherMember.user.name;
  }
  if (room.name) return room.name;
  if (room.type === "CLIENT_TO_STAFF") {
    const member = room.members?.find((m) => m.user);
    return member?.user?.name || tr(t, "chat.util.client", "عميل");
  }
  return roomTypeLabel(room.type, t) || room.type || tr(t, "chat.util.conversation", "محادثة");
};

/** Display-only role helper for cosmetic affordances. All ACCESS gating goes through
 *  usePermission + record.capabilities, never role alone (shared-permissions). */
export const isAdminRole = (user) =>
  ["ADMIN", "SUPER_ADMIN", "CONTACT_INITIATOR"].includes(user?.role);
