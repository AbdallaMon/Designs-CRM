"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  initSocket,
  getSocket,
  joinChatRoom,
  leaveChatRoom,
  onSocket,
  offSocket,
  typing,
  emitStopTyping,
} from "../utils/socketIO";
import { useAuth } from "@/app/providers/AuthProvider";

/**
 * Hook for real-time chat updates via Socket.IO
 * Handles: new messages, message edits, user typing, member joins/leaves, calls
 *
 * @param {number} roomId - Chat room ID
 * @param {function} onNewMessage - Callback when new message arrives
 * @param {function} onMessageEdited - Callback when message is edited
 * @param {function} onMessageDeleted - Callback when message is deleted
 * @param {function} onTyping - Callback when user starts typing
 * @param {function} onStopTyping - Callback when user stops typing
 * @param {function} onMemberJoined - Callback when member joins
 * @param {function} onMemberLeft - Callback when member leaves
 * @param {function} onCallInitiated - Callback when call starts
 * @param {function} onCallEnded - Callback when call ends
 * @param {boolean} enabled - Enable/disable socket connection
 */
export function useSocketIO(
  roomId,
  {
    onNewMessage,
    onMessageEdited,
    onMessageDeleted,
    onTyping,
    onStopTyping,
    onMemberJoined,
    onMemberLeft,
    onCallInitiated,
    onCallEnded,
    enabled = true,
  } = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();
  // Initialize socket on mount
  useEffect(() => {
    if (!enabled) return;

    const url = process.env.NEXT_PUBLIC_URL;
    socketRef.current = initSocket(url);

    socketRef.current.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
      if (roomId) {
        joinChatRoom(roomId);
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    return () => {
      // Cleanup is handled by parent component
    };
  }, [enabled, user]);

  // Join/leave room when roomId changes
  useEffect(() => {
    if (!isConnected || !roomId || !socketRef.current) return;

    joinChatRoom(roomId);

    return () => {
      if (socketRef.current) {
        leaveChatRoom(roomId);
      }
    };
  }, [roomId, isConnected]);

  // Message events
  useEffect(() => {
    console.log(socketRef, "socketRef in messag events");
    if (!socketRef.current) return;

    const handleNewMessage = (data) => {
      console.log(data, "new message added");

      onNewMessage?.(data);
    };

    const handleMessageEdited = (data) => {
      onMessageEdited?.(data);
    };

    const handleMessageDeleted = (data) => {
      console.log(data, "data");
      onMessageDeleted?.(data);
    };

    socketRef.current.on("message:created", handleNewMessage);
    socketRef.current.on("message:edited", handleMessageEdited);
    socketRef.current.on("message:deleted", handleMessageDeleted);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("message:created", handleNewMessage);
        socketRef.current.off("message:edited", handleMessageEdited);
        socketRef.current.off("message:deleted", handleMessageDeleted);
      }
    };
  }, [onNewMessage, onMessageEdited, onMessageDeleted]);

  // Typing indicators
  useEffect(() => {
    if (!socketRef.current) return;

    const handleUserTyping = (data) => {
      setTypingUsers((prev) => new Set([...prev, data.userId]));
      console.log(data, "data in handleUserTyping");
      onTyping?.(data);
    };

    const handleUserStopTyping = (data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
      onStopTyping?.(data);
    };

    socketRef.current.on("user:typing", handleUserTyping);
    socketRef.current.on("user:stop_typing", handleUserStopTyping);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("user:typing", handleUserTyping);
        socketRef.current.off("user:stop_typing", handleUserStopTyping);
      }
    };
  }, [onTyping, onStopTyping]);

  // Member events
  useEffect(() => {
    if (!socketRef.current) return;

    const handleMemberJoined = (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
      onMemberJoined?.(data);
    };

    const handleMemberLeft = (data) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
      onMemberLeft?.(data);
    };

    socketRef.current.on("member:joined", handleMemberJoined);
    socketRef.current.on("member:left", handleMemberLeft);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("member:joined", handleMemberJoined);
        socketRef.current.off("member:left", handleMemberLeft);
      }
    };
  }, [onMemberJoined, onMemberLeft]);

  // Call events
  useEffect(() => {
    if (!socketRef.current) return;

    const handleCallInitiated = (data) => {
      onCallInitiated?.(data);
    };

    const handleCallEnded = (data) => {
      onCallEnded?.(data);
    };

    socketRef.current.on("call:initiated", handleCallInitiated);
    socketRef.current.on("call:ended", handleCallEnded);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("call:initiated", handleCallInitiated);
        socketRef.current.off("call:ended", handleCallEnded);
      }
    };
  }, [onCallInitiated, onCallEnded]);

  // Function to emit typing indicator
  const emitTyping = useCallback(() => {
    typing({ roomId, user });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [roomId]);

  // Function to emit stop typing
  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    emitStopTyping({ roomId, user });
  }, [roomId]);

  return {
    isConnected,
    typingUsers: Array.from(typingUsers),
    onlineUsers: Array.from(onlineUsers),
    emitTyping,
    stopTyping,
    socket: socketRef.current,
  };
}
