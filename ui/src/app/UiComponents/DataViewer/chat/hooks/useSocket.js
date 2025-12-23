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

    // ---- event -> handler-key mapping ----
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
      "call:initiated": "onCallInitiated",
      "call:ended": "onCallEnded",

      // generic notification
      notification: "onNotification",
      "notification:user_typing": "onTypingNotification",
      "notification:user_stopped_typing": "onStopTypingNotification",
      "notification:new_message": "onNewMessageNotification",
      "notification:messages_read": "onMessagesReadNotification",
      "notification:room_removed": "onRoomDeletedNotification",
      "notification:room_created": "onRoomCreatedNotification",
      "notification:room_updated": "onRoomUpdated",

      disconnect: () => {
        console.log("Socket disconnected");
      },
    };

    // ---- stable listener functions (must be same ref for off()) ----
    const listeners = {};

    Object.entries(events).forEach(([eventName, handlerKey]) => {
      const listener = (data) => {
        const fn = handlersRef.current?.[handlerKey];
        if (typeof fn === "function") fn(data);
      };
      listeners[eventName] = listener;
      socket.on(eventName, listener);
    });

    // Special routing inside "notification"

    return () => {
      Object.entries(listeners).forEach(([eventName, listener]) => {
        socket.off(eventName, listener);
      });
    };
  }, [socket]);
  return { socket };
}
