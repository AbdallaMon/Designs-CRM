// Chat realtime emit helpers + event-binding hook. Built on the v2 SocketProvider
// (providers/SocketProvider) — reuses the same Socket.IO connection/events the legacy
// chat UI used, just on the v2 provider. Emits and the inbound event map are migrated
// verbatim from UiComponents/DataViewer/chat/utils/socketIO.js + hooks/useSocket.js.

"use client";

import { useEffect, useRef } from "react";
import { useSocket } from "@/app/v2/providers/SocketProvider";

// ── Emit helpers ────────────────────────────────────────────────────────────────
function emit(socket, event, data) {
  if (socket && socket.connected) socket.emit(event, data);
}

export const chatEmit = {
  joinRoom: (socket, roomId, user) => emit(socket, "join_room", { roomId, user }),
  joinRoomAsClient: (socket, roomId, clientId) =>
    emit(socket, "join_room_client", { roomId, clientId }),
  leaveRoom: (socket, roomId) => emit(socket, "leave_room", { roomId }),
  typing: (socket, { roomId, user }) =>
    emit(socket, "user:typing", { roomId, user }),
  stopTyping: (socket, { roomId, user }) =>
    emit(socket, "user:stop_typing", { roomId, user }),
  sendMessage: (socket, { data }) => emit(socket, "message:create", { data }),
  editMessage: (socket, { messageId, roomId, content, userId }) =>
    emit(socket, "message:edit", { messageId, roomId, content, userId }),
  deleteMessage: (socket, { messageId, roomId, userId }) =>
    emit(socket, "message:delete", { messageId, roomId, userId }),
  pinMessage: (socket, { messageId, roomId, userId }) =>
    emit(socket, "message:pin", { messageId, roomId, userId }),
  unpinMessage: (socket, { messageId, roomId, userId }) =>
    emit(socket, "message:unpin", { messageId, roomId, userId }),
  markMessagesRead: (socket, roomId, userId) =>
    emit(socket, "messages:mark_read", { roomId, userId }),
  markMessageRead: (socket, roomId, messageId, userId) =>
    emit(socket, "message:mark_read", { roomId, messageId, userId }),
  forwardMessages: (socket, { roomsIds, messageIds, userId }) =>
    emit(socket, "messages:forward", { roomsIds, messageIds, userId }),
  online: (socket, { userId }) => emit(socket, "user:online", { userId }),
};

// Inbound socket event → handler-key map (verbatim from legacy useSocket).
const EVENT_MAP = {
  "message:created": "onMessageCreated",
  "message:edited": "onMessageEdited",
  "message:deleted": "onMessageDeleted",
  "message:pinned": "onMessagePinned",
  "message:unpinned": "onMessageUnpinned",
  "user:typing": "onTyping",
  "user:stop_typing": "onStopTyping",
  "member:joined": "onMemberJoined",
  "member:left": "onMemberLeft",
  "member:removed": "onMemberRemoved",
  "members:added": "onMembersAdded",
  "member:role_updated": "onMemberRoleUpdated",
  "room:updated": "onRoomUpdatedEvent",
  "chat:error": "onChatError",
  notification: "onNotification",
  "notification:user_typing": "onTypingNotification",
  "notification:user_stopped_typing": "onStopTypingNotification",
  "notification:new_message": "onNewMessageNotification",
  "notification:messages_read": "onMessagesReadNotification",
  "notification:room_removed": "onRoomDeletedNotification",
  "notification:room_created": "onRoomCreatedNotification",
  "notification:room_updated": "onRoomUpdated",
};

/**
 * Bind chat socket event handlers. `handlers` is an object keyed by the handler-key
 * names in EVENT_MAP. Returns the live socket so callers can emit.
 */
export function useChatSocket(handlers = {}) {
  const { socket } = useSocket();
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!socket) return;
    const listeners = {};

    Object.entries(EVENT_MAP).forEach(([eventName, handlerKey]) => {
      if (typeof handlersRef.current?.[handlerKey] !== "function") return;
      const listener = (data) => {
        const fn = handlersRef.current?.[handlerKey];
        if (typeof fn === "function") fn(data);
      };
      listeners[eventName] = listener;
      socket.on(eventName, listener);
    });

    return () => {
      Object.entries(listeners).forEach(([eventName, listener]) =>
        socket.off(eventName, listener),
      );
    };
  }, [socket]);

  return { socket };
}
