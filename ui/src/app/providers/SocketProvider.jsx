"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { initSocket } from "../UiComponents/DataViewer/chat/utils";
import { useAuth } from "./AuthProvider";

export const SocketContext = createContext(null);

const url = process.env.NEXT_PUBLIC_URL;

export default function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !user.id) return;

    if (!socketRef.current) {
      const newSocket = initSocket(url, {
        query: { userId: user.id },
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Emit online status
      newSocket.emit("online", {
        userId: user.id,
        user: {
          name: user.name,
          email: user.email,
          id: user.id,
        },
      });
    }

    return () => {
      // Don't disconnect on unmount - keep socket alive
    };
  }, [user]);

  const contextValue = {
    socket,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
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
