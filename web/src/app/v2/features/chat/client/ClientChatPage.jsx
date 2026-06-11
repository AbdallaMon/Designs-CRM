"use client";

// PUBLIC client-chat page (v2). Reads ?token= and ?roomId= from the query — the token is
// the only credential. It validates the token against /v2/client/chat/rooms/validate-token
// (apiFetch.public), then renders the SHARED v2 ChatWindow in client mode: the same window
// staff use, driven by clientContext = { token, clientId, client } so its hooks read from
// /v2/client/chat/* and emit as the client identity over the v2 socket. Mirrors the legacy
// UiComponents ClientChatPage exactly, with ZERO legacy (/client, /shared, legacyApiFetch).
// Arabic, RTL.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Box, CircularProgress, Container } from "@mui/material";
import { ChatWindow } from "../components/window/ChatWindow.jsx";
import { clientChatService } from "../chat.service.js";
import { ClientChatProviders } from "./ClientChatProviders.jsx";

export function ClientChatPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const roomIdParam = searchParams.get("roomId");

  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    async function validate() {
      if (!token) {
        setLoading(false);
        setError("رابط غير صالح: لا يوجد رمز وصول.");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await clientChatService.validateToken(token);
        if (active) setTokenData(res?.data ?? null);
      } catch (e) {
        if (active) setError(e?.message || "تعذر التحقق من رمز الوصول.");
      } finally {
        if (active) setLoading(false);
      }
    }
    validate();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !tokenData || !tokenData.isValid) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error || "رمز الوصول غير صالح أو منتهي الصلاحية."}</Alert>
      </Container>
    );
  }

  const clientId = tokenData.chatMember?.clientId;
  const client = tokenData.chatMember?.client;
  // The token's room is authoritative; prefer the resolved room id over the query param.
  const roomId = tokenData.room?.id ?? (roomIdParam ? parseInt(roomIdParam, 10) : null);

  return (
    <ClientChatProviders clientId={clientId}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <ChatWindow
          roomId={roomId}
          onRoomActivity={() => {}}
          reFetchRooms={() => {}}
          clientContext={{ token, clientId, client }}
        />
      </Container>
    </ClientChatProviders>
  );
}

export default ClientChatPage;
