"use client";

import { useEffect, useRef } from "react";
import { useSocket as useSocketContext } from "@/app/providers/SocketProvider";

export function useSocket(handlers = {}) {
  const { socket } = useSocketContext();
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!socket) return;

    const events = {
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
      "call:initiated": "onCallInitiated",
      "call:ended": "onCallEnded",
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

      // always ok as inline
      disconnect: () => console.log("Socket disconnected"),
    };

    const listeners = {};

    Object.entries(events).forEach(([eventName, handlerKeyOrFn]) => {
      // ✅ skip events that you didn't provide a handler for
      if (typeof handlerKeyOrFn === "string") {
        const hasHandler =
          typeof handlersRef.current?.[handlerKeyOrFn] === "function";
        if (!hasHandler) return;
      }

      const listener = (data) => {
        if (typeof handlerKeyOrFn === "function") return handlerKeyOrFn(data);
        const fn = handlersRef.current?.[handlerKeyOrFn];
        if (typeof fn === "function") fn(data);
      };

      listeners[eventName] = listener;
      socket.on(eventName, listener);
    });

    return () => {
      Object.entries(listeners).forEach(([eventName, listener]) => {
        socket.off(eventName, listener);
      });
    };
  }, [socket]);

  // useEffect(() => {
  //   if (!socket) return;
  //   const any = (event, ...args) =>
  //     console.log("SOCKET ANY:", event, args?.[0]);
  //   socket.onAny(any);
  //   return () => socket.offAny(any);
  // }, [socket]);

  return { socket };
}
