import { CHAT_ROOM_TYPE_LABELS } from "./config/chatConstants.js";

export const getRoomAvatar = (room) => {
  if (!room) return null;
  if (room.avatarUrl) return room.avatarUrl;
  if (room.type === "STAFF_TO_STAFF") {
    const otherMember = room.otherMembers?.[0];
    return otherMember?.user?.profilePicture || otherMember?.client?.profilePicture;
  }
  return room.name?.charAt(0);
};

export const getRoomLabel = (room) => {
  if (!room) return "جاري التحميل...";
  if (room.type === "STAFF_TO_STAFF") {
    const otherMember = room.otherMembers?.[0];
    if (otherMember?.user) return otherMember.user.name;
  }
  if (room.name) return room.name;
  if (room.type === "CLIENT_TO_STAFF") {
    const member = room.members?.find((m) => m.user);
    return member?.user?.name || "عميل";
  }
  return CHAT_ROOM_TYPE_LABELS[room.type] || room.type || "محادثة";
};

/** Display-only role helper for cosmetic affordances. All ACCESS gating goes through
 *  usePermission + record.capabilities, never role alone (shared-permissions). */
export const isAdminRole = (user) =>
  ["ADMIN", "SUPER_ADMIN", "CONTACT_INITIATOR"].includes(user?.role);
