"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { initSocket } from "../UiComponents/DataViewer/chat/utils";
import { useAuth } from "./AuthProvider";
import DotsLoader from "../UiComponents/feedback/loaders/DotsLoading";

export const SocketContext = createContext(null);

const url = process.env.NEXT_PUBLIC_URL;

export default function SocketProvider({ children, clientId }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.id) return;

    if (!socketRef.current) {
      const newSocket = initSocket(url, {
        query: { userId: user.id, type: "user" },
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.emit("user:online", {
        userId: user.id,
      });
      setLoading(false);
    }

    return () => {
      // Don't disconnect on unmount - keep socket alive
    };
  }, [user]);
  useEffect(() => {
    if (!clientId) return;

    if (!socketRef.current) {
      const newSocket = initSocket(url, {
        query: { clientId: clientId, type: "client" },
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.emit("client:online", {
        clientId,
      });
      setLoading(false);
    }

    return () => {
      // Don't disconnect on unmount - keep socket alive
    };
  }, [clientId]);
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
