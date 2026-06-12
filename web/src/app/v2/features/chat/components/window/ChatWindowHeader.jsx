"use client";

import { Box, IconButton, Avatar, Typography, Tooltip, CircularProgress } from "@mui/material";
import { FaArrowLeft, FaPhone, FaVideo, FaUsers } from "react-icons/fa";
import { CHAT_ROOM_TYPE_LABELS, CHAT_ROOM_TYPE_LABEL_KEYS } from "../../config/chatConstants.js";
import { ChatSettings } from "./ChatSettings.jsx";
import { getRoomAvatar, getRoomLabel } from "../../chat.utils.js";
import { useT } from "@/app/v2/lib/i18n";

export function ChatWindowHeader({
  onClose,
  isMobile,
  currentTab,
  setCurrentTab,
  isNotDirectChat,
  onShowAddMembers,
  reFetchRooms,
  room,
  loading,
  fetchChatRoom,
}) {
  const { t } = useT();
  const roomLabel = getRoomLabel(room, t);
  const roomAvatar = getRoomAvatar(room);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        position: "relative",
        background: "linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)",
      }}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {((isMobile && onClose) || currentTab === 1) && (
          <IconButton size="small" onClick={currentTab === 1 ? () => setCurrentTab(0) : onClose} sx={{ mr: 1 }}>
            <FaArrowLeft size={18} />
          </IconButton>
        )}
        <Box sx={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }} onClick={() => setCurrentTab(1)}>
          <Avatar
            src={roomAvatar}
            alt={roomLabel}
            sx={{ width: 40, height: 40, border: "2px solid", borderColor: "background.paper", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          >
            {roomLabel.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{roomLabel}</Typography>
            {room && (
              <Typography variant="caption" color="textSecondary">
                {t(CHAT_ROOM_TYPE_LABEL_KEYS[room.type], CHAT_ROOM_TYPE_LABELS[room.type]) || room.type}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title={t("chat.header.voiceCall", "مكالمة صوتية")} arrow>
          <IconButton size="small"><FaPhone size={18} /></IconButton>
        </Tooltip>
        <Tooltip title={t("chat.header.videoCall", "مكالمة فيديو")} arrow>
          <IconButton size="small"><FaVideo size={18} /></IconButton>
        </Tooltip>
        {isNotDirectChat && (
          <Tooltip title={t("chat.header.members", "الأعضاء")} arrow>
            <IconButton size="small" onClick={onShowAddMembers}><FaUsers size={18} /></IconButton>
          </Tooltip>
        )}
        <ChatSettings room={room} reFetchRooms={reFetchRooms} fetchChatRoom={fetchChatRoom} />
      </Box>
    </Box>
  );
}
