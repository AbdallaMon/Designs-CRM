"use client";

import React from "react";
import {
  Box,
  IconButton,
  Avatar,
  Typography,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { FaArrowLeft, FaPhone, FaVideo, FaUsers } from "react-icons/fa";
import { CHAT_ROOM_TYPE_LABELS } from "../../utils/chatConstants";
import ChatSettings from "./ChatSettings";
import { getRoomAvatar, getRoomLabel } from "../rooms/helpers";

export function ChatWindowHeader({
  roomId,
  onClose,
  isMobile,
  currentTab,
  setCurrentTab,
  isNotDirectChat,
  onShowAddMembers,
  members,
  reFetchRooms,
  fetchMembers,
  room,
  loading,
  fetchChatRoom,
  clientId,
}) {
  const roomLabelFinal = getRoomLabel(room);
  const roomLabelToShow = roomLabelFinal;
  const roomAvatar = getRoomAvatar(room);
  const memberCount = Array.isArray(members) ? members.length : 0;
  const roomTypeLabel = room
    ? CHAT_ROOM_TYPE_LABELS[room.type] || room.type
    : "";
  const subtitle =
    isNotDirectChat && memberCount > 0
      ? `${roomTypeLabel} · ${memberCount} عضو`
      : roomTypeLabel;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1.25,
        borderBottom: "1px solid",
        borderColor: "divider",
        position: "relative",
        bgcolor: "background.paper",
      }}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid",
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
      {/* Left Section: Room Info */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {((isMobile && onClose) || currentTab === 1) && (
          <IconButton
            size="small"
            onClick={currentTab === 1 ? () => setCurrentTab(0) : onClose}
            sx={{
              mr: 1,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
            }}
          >
            <FaArrowLeft size={18} />
          </IconButton>
        )}
        <Box
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
          onClick={() => setCurrentTab(1)}
        >
          <Avatar
            src={roomAvatar}
            alt={roomLabelToShow}
            sx={{
              width: 44,
              height: 44,
              fontWeight: 700,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              boxShadow: (theme) => theme.shadows[2],
              cursor: "pointer",
            }}
          >
            {roomLabelToShow.charAt(0)}
          </Avatar>

          <Box sx={{ cursor: "pointer", minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, lineHeight: 1.3 }}
              noWrap
            >
              {roomLabelToShow}
            </Typography>
            {room && subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Right Section: Actions */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.25,
          "& .MuiIconButton-root": {
            color: "text.secondary",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "action.hover",
              color: "primary.main",
            },
          },
        }}
      >
        <Tooltip title="مكالمة صوتية" arrow>
          <IconButton size="small">
            <FaPhone size={16} />
          </IconButton>
        </Tooltip>
        <Tooltip title="مكالمة فيديو" arrow>
          <IconButton size="small">
            <FaVideo size={16} />
          </IconButton>
        </Tooltip>
        {isNotDirectChat && (
          <Tooltip title="الأعضاء" arrow>
            <IconButton size="small" onClick={onShowAddMembers}>
              <FaUsers size={16} />
            </IconButton>
          </Tooltip>
        )}
        {!clientId && (
          <ChatSettings
            members={members}
            room={room}
            reFetchRooms={reFetchRooms}
            fetchMembers={fetchMembers}
            fetchChatRoom={fetchChatRoom}
          />
        )}
      </Box>
    </Box>
  );
}
