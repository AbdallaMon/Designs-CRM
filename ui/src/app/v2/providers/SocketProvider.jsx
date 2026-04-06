"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { initSocket } from "@/app/UiComponents/DataViewer/chat/utils";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading";
import config from "@/app/v2/lib/config";

export const SocketContext = createContext(null);

export function SocketProvider({ children, clientId }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (socketRef.current) return;

    const isUser = user?.id;
    const isClient = clientId;
    if (!isUser && !isClient) return;

    const query = isUser
      ? { userId: user.id, type: "user" }
      : { clientId, type: "client" };

    const newSocket = initSocket(config.legacyApiUrl, { query });
    socketRef.current = newSocket;
    setSocket(newSocket);

    const onlineEvent = isUser ? "user:online" : "client:online";
    const onlinePayload = isUser ? { userId: user.id } : { clientId };
    newSocket.emit(onlineEvent, onlinePayload);

    setIsReady(true);
  }, [user, clientId]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {!isReady && !socketRef.current ? (
        <DotsLoader instantLoading={true} />
      ) : (
        children
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
}
