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
        background:
          "linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)",
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
              width: 40,
              height: 40,
              border: "2px solid",
              borderColor: "background.paper",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
            }}
          >
            {roomLabelToShow.charAt(0)}
          </Avatar>

          <Box sx={{ cursor: "pointer" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {roomLabelToShow}
            </Typography>
            {room && (
              <Typography variant="caption" color="textSecondary">
                {CHAT_ROOM_TYPE_LABELS[room.type] || room.type}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Right Section: Actions */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title="Voice call" arrow>
          <IconButton
            size="small"
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
            }}
          >
            <FaPhone size={18} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Video call" arrow>
          <IconButton
            size="small"
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
            }}
          >
            <FaVideo size={18} />
          </IconButton>
        </Tooltip>
        {isNotDirectChat && (
          <Tooltip title="Members" arrow>
            <IconButton
              size="small"
              onClick={onShowAddMembers}
              sx={{
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FaUsers size={18} />
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
