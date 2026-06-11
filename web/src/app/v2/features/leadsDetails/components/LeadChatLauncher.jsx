"use client";

// <LeadChatLauncher> — the lead-scoped "المحادثات" tab body (item 6, Chats).
//
// The full page-mode ChatContainer can't be embedded here cleanly: it owns the ?roomId URL param
// and a full-height two-pane layout that collides with the hub's ?tab/?sub state. So instead of
// re-mounting it lead-scoped, this is a COMPACT LAUNCHER that lists ONLY this lead's chat rooms
// (useChatRooms({ clientLeadId }) — the BE narrows GET /v2/chat/rooms by clientLeadId) and opens
// the real chat page focused on the chosen room (/v2/chat?roomId=). No dialogs/sockets are
// duplicated here; the chat page owns all of that. Gated on PERMISSIONS.CHAT.ROOM_LIST.

import { useMemo } from "react";
import NextLink from "next/link";
import {
  Avatar,
  Box,
  Button,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { MdChat, MdOpenInNew } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useT } from "@/app/v2/lib/i18n";
import { useChatRooms } from "@/app/v2/features/chat";
import { getRoomLabel } from "@/app/v2/features/chat/chat.utils.js";
import { SectionCard } from "@/app/v2/shared/components/SectionCard.jsx";

export function LeadChatLauncher({ leadId, lead }) {
  const { hasPermission } = usePermission();
  const { t } = useT();
  const canList = hasPermission(PERMISSIONS.CHAT.ROOM_LIST);

  // Lead-scoped rooms only. The hook self-fetches when clientLeadId changes.
  const { rooms, initialLoading } = useChatRooms({ clientLeadId: leadId });
  const leadRooms = useMemo(() => (Array.isArray(rooms) ? rooms : []), [rooms]);

  if (!canList) {
    return (
      <SectionCard>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">{t("leadsDetails.chat.denied")}</Typography>
        </Box>
      </SectionCard>
    );
  }

  return (
    <SectionCard>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ display: "flex", fontSize: 22, color: "primary.main" }}>
              <MdChat />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("leadsDetails.chat.title")}
            </Typography>
          </Stack>
          <Button
            component={NextLink}
            href="/v2/chat"
            variant="outlined"
            size="small"
            startIcon={<MdOpenInNew />}
          >
            {t("leadsDetails.chat.open")}
          </Button>
        </Stack>

        {initialLoading ? (
          <Typography color="text.secondary">{t("leadsDetails.chat.loading")}</Typography>
        ) : leadRooms.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 0.5 }}>
              {t("leadsDetails.chat.empty.title")}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {t("leadsDetails.chat.empty.description")}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {leadRooms.map((room) => (
              <ListItemButton
                key={room.id}
                component={NextLink}
                href={`/v2/chat?roomId=${room.id}`}
                sx={{ borderRadius: 2 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {(getRoomLabel(room) || "?").trim().charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={getRoomLabel(room)}
                  secondary={
                    lead?.client?.name
                      ? t("leadsDetails.chat.roomSecondary").replace("{name}", lead.client.name)
                      : t("leadsDetails.chat.roomSecondaryFallback")
                  }
                  slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                />
                <Box sx={{ display: "flex", color: "text.disabled", fontSize: 18 }}>
                  <MdOpenInNew />
                </Box>
              </ListItemButton>
            ))}
          </List>
        )}
      </Stack>
    </SectionCard>
  );
}

export default LeadChatLauncher;
