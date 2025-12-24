import { CHAT_ROOM_TYPE_LABELS } from "../../utils/chatConstants";

export const getRoomAvatar = (room) => {
  if (room.avatarUrl) return room.avatarUrl;
  if (room.type === "STAFF_TO_STAFF") {
    const otherMember = room.otherMembers?.[0];
    return (
      otherMember.user?.profilePicture || otherMember.client?.profilePicture
    );
  }
  return room.name?.charAt(0);
};

export const getRoomLabel = (room) => {
  if (room.type === "STAFF_TO_STAFF") {
    const otherMember = room.otherMembers?.[0];
    if (otherMember?.user) {
      return otherMember.user.name;
    }
  }
  if (room.name) return room.name;
  if (room.type === "CLIENT_TO_STAFF") {
    const member = room.members?.find((m) => m.user);
    return member?.user?.name || "Client";
  }
  return CHAT_ROOM_TYPE_LABELS[room.type] || room.type || "Chat";
};
