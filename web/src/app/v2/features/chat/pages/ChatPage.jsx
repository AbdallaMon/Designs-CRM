"use client";

import { Box, Typography } from "@mui/material";
import { ChatContainer } from "../components/chat/ChatContainer.jsx";
import { SocketProvider } from "@/app/v2/providers/SocketProvider";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";

/**
 * Full-page chat. Gated on chat.room.list; wraps the container in SocketProvider so the
 * realtime layer is available even if the host layout hasn't mounted it. The list/detail
 * actions inside are further gated on the per-record capabilities + codes.
 */
export function ChatPage() {
  const { hasPermission } = usePermission();
  const { t } = useT();

  if (!hasPermission(PERMISSIONS.CHAT.ROOM_LIST)) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="textSecondary">{t("chat.noAccess", "لا تملك صلاحية الوصول إلى المحادثات")}</Typography>
      </Box>
    );
  }

  return (
    <SocketProvider>
      <ChatContainer />
    </SocketProvider>
  );
}

export default ChatPage;
