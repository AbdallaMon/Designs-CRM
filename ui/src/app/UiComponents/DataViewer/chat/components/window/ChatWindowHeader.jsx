"use client";

import React from "react";
import { Box, IconButton, Avatar, Typography, Tooltip } from "@mui/material";
import { FaArrowLeft, FaPhone, FaVideo, FaUsers } from "react-icons/fa";
import { CHAT_ROOM_TYPE_LABELS } from "../../utils/chatConstants";
import ChatSettings from "../members/ChatSettings";
import { getRoomAvatar, getRoomLabel } from "../rooms/helpers";

export function ChatWindowHeader({
  room,
  roomLabel,
  onClose,
  isMobile,
  currentTab,
  setCurrentTab,
  isNotDirectChat,
  onShowAddMembers,
  members,
  reFetchRooms,
}) {
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
        background:
          "linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)",
      }}
    >
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
            src={getRoomAvatar(room)}
            alt={getRoomLabel(room)}
            sx={{
              width: 40,
              height: 40,
              border: "2px solid",
              borderColor: "background.paper",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              cursor: "pointer",
            }}
          >
            {getRoomLabel(room).charAt(0)}
          </Avatar>

          <Box sx={{ cursor: "pointer" }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {roomLabel}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {CHAT_ROOM_TYPE_LABELS[room.type] || room.type}
            </Typography>
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
        <ChatSettings
          members={members}
          room={room}
          reFetchRooms={reFetchRooms}
        />
      </Box>
    </Box>
  );
}
