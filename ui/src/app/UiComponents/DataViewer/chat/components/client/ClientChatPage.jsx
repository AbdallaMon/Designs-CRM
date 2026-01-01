"use client";

import { Alert, Container } from "@mui/material";
import { ChatWindow } from "../window";
import SocketProvider from "@/app/providers/SocketProvider";
import { useEffect, useState } from "react";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";

export function ClientChatPage({ token, roomId }) {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function validateToken() {
      await getDataAndSet({
        url: `client/chat/rooms/validate-token?token=${token}&`,
        setData: setTokenData,
        setLoading,
      });
    }
    validateToken();
  }, [token]);
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {loading ? (
        ""
      ) : !loading && tokenData && tokenData.isValid ? (
        <SocketProvider clientId={tokenData.chatMember.clientId}>
          <ChatWindow
            roomId={parseInt(roomId)}
            onRoomActivity={() => {}}
            reFetchRooms={() => {}}
            clientId={tokenData.chatMember.clientId}
            client={tokenData.chatMember.client}
          />
        </SocketProvider>
      ) : (
        <Alert severity="error">Invalid or expired token.</Alert>
      )}
    </Container>
  );
}
