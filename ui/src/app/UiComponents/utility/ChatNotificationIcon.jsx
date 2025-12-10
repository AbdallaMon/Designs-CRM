"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  Typography,
} from "@mui/material";
import { FaComments, FaClock } from "react-icons/fa";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { getData } from "@/app/helpers/functions/getData";
import {
  initSocket,
  onSocket,
  offSocket,
  joinChatRoom,
} from "@/app/UiComponents/DataViewer/chat/utils/socketIO";

dayjs.extend(relativeTime);

const ChatNotificationIcon = () => {
  return null;
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
  const apiBase = process.env.NEXT_PUBLIC_URL || "";

  const unreadCount = useMemo(
    () => rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0),
    [rooms]
  );

  const fetchRooms = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await getData({
        url: `shared/chat/rooms?limit=10&`,
        setLoading: () => {},
      });
      if (response?.status === 200) {
        setRooms(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  useEffect(() => {
    if (!user || rooms.length === 0) return;
    const socket = initSocket(
      process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_URL
    );

    rooms.forEach((room) => {
      if (room.id) {
        joinChatRoom(room.id);
      }
    });

    const handleNewMessage = (data) => {
      setRooms((prev) => {
        const idx = prev.findIndex((r) => r.id === data.roomId);
        if (idx === -1) return prev;
        const target = prev[idx];
        const updated = {
          ...target,
          lastMessage: data,
          unreadCount:
            (target.unreadCount || 0) + (data.senderId === user.id ? 0 : 1),
        };
        const clone = [...prev];
        clone[idx] = updated;
        return clone;
      });
    };

    onSocket("message:new", handleNewMessage);

    return () => {
      offSocket("message:new", handleNewMessage);
    };
  }, [rooms, user]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAllAsRead = async () => {
    if (!rooms.length) return;
    // Backend should mark all provided rooms as read for this user
    try {
      await fetch(`${apiBase}/shared/chat/rooms/read`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomIds: rooms.map((r) => r.id) }),
      });
    } catch (error) {
      console.error("Error marking chats as read:", error);
    }
    setRooms((prev) => prev.map((r) => ({ ...r, unreadCount: 0 })));
  };

  useEffect(() => {
    if (open) {
      markAllAsRead();
    }
  }, [open]);

  const renderSecondaryText = (room) => {
    if (!room.lastMessage) return "No messages yet";
    const senderName = room.lastMessage.sender?.name || "Someone";
    const content = room.lastMessage.content || "";
    const snippet =
      content.length > 80 ? `${content.slice(0, 80)}...` : content;
    return `${senderName}: ${snippet}`;
  };

  const renderTime = (room) => {
    const ts = room.lastMessage?.createdAt;
    if (!ts) return "";
    const messageTime = dayjs(ts);
    return messageTime.isBefore(dayjs().subtract(1, "day"))
      ? messageTime.format("DD/MM/YYYY HH:mm")
      : messageTime.fromNow();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-controls={open ? "chat-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        color="inherit"
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="primary">
          <FaComments size={20} />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="chat-menu"
        open={open}
        onClose={handleClose}
        sx={{
          "& .MuiList-root": { py: 0 },
          "& .MuiPaper-root": {
            width: "360px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            p: 0,
          },
        }}
      >
        {loading ? (
          <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={20} />
          </Box>
        ) : (
          <List
            sx={{
              maxHeight: "420px",
              p: 0,
              overflowY: "auto",
            }}
          >
            {rooms.length === 0 ? (
              <Typography textAlign="center" sx={{ padding: "16px" }}>
                No chat notifications
              </Typography>
            ) : (
              rooms.map((room) => (
                <ListItem
                  key={room.id}
                  sx={{
                    "&:hover": { backgroundColor: "#f0f4f8" },
                    padding: "12px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    backgroundColor:
                      room.unreadCount && room.unreadCount > 0
                        ? "#f5f5f5"
                        : "inherit",
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={room.avatarUrl || undefined}>
                      <FaComments size={14} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontWeight:
                              room.unreadCount && room.unreadCount > 0
                                ? 700
                                : 500,
                          }}
                        >
                          {room.name || "Chat"}
                        </Typography>
                        {room.unreadCount && room.unreadCount > 0 ? (
                          <Badge
                            color="primary"
                            badgeContent={room.unreadCount}
                            sx={{ "& .MuiBadge-badge": { right: -12 } }}
                          />
                        ) : null}
                      </Box>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {renderSecondaryText(room)}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <FaClock size={12} />
                          <Typography variant="caption" color="text.secondary">
                            {renderTime(room)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        )}
        <Button
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: "10px 16px",
            color: "#1a73e8",
            fontWeight: "bold",
            backgroundColor: "white",
          }}
          component={Link}
          href="/dashboard/chat"
        >
          Open chat
        </Button>
      </Menu>
    </>
  );
};

export default ChatNotificationIcon;
