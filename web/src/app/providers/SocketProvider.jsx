"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  disconnectSocket,
  initSocket,
} from "@/features/chat/utils/index.js";
import { useAuth } from "./AuthProvider";
import DotsLoader from "@/shared/components/feedback/loaders/DotsLoading.jsx";

export const SocketContext = createContext(null);

const url = process.env.NEXT_PUBLIC_URL;

export default function SocketProvider({ children, chatToken = null }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const staffId = user?.id ?? null;
    if (!staffId && !chatToken) return;

    if (!socketRef.current) {
      const newSocket = initSocket(url, {
        auth: chatToken ? { chatToken } : {},
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.emit(chatToken ? "client:online" : "user:online");
      setLoading(false);
    }

    return () => {
      disconnectSocket();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user?.id, chatToken]);
  const contextValue = {
    socket,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {loading && !socketRef.current ? (
        <DotsLoader instantLoading={true} />
      ) : (
        children
      )}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
