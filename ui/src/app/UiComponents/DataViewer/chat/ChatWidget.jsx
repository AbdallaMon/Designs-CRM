"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  Button,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slide,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  FaArrowLeft,
  FaComments,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";
import Link from "next/link";
import { ChatRoomsList } from "@/app/UiComponents/DataViewer/chat/components/ChatRoomsList";
import { ChatWindow } from "@/app/UiComponents/DataViewer/chat/components/ChatWindow";
import { useChatRooms } from "@/app/UiComponents/DataViewer/chat/hooks/useChatRooms";
import { useAuth } from "@/app/providers/AuthProvider";
import { getData } from "@/app/helpers/functions/getData";
import { CHAT_ROOM_TYPES } from "@/app/UiComponents/DataViewer/chat/utils/chatConstants";
import { initSocket } from "@/app/UiComponents/DataViewer/chat/utils/socketIO";

export function ChatWidget({ projectId = null, clientLeadId = null }) {
  return;

  const { isLoggedIn } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("LIST");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const {
    rooms,
    loading: roomsLoading,
    loadingMore: roomsLoadingMore,
    createRoom,
    fetchRooms,
    loadMoreRooms,
    totalPages,
    page,
  } = useChatRooms({ projectId, category: null, limit: 25 });

  useEffect(() => {
    if (!open) return;
    const socket = initSocket(process.env.NEXT_PUBLIC_URL);
    const handleMessageCreated = () => {
      fetchRooms(0, false);
    };

    socket?.on("message:created", handleMessageCreated);

    return () => {
      socket?.off("message:created", handleMessageCreated);
    };
  }, [open, fetchRooms]);

  useEffect(() => {
    if (!selectedRoom) return;
    const updated = rooms.find((r) => r.id === selectedRoom.id);
    if (updated && updated !== selectedRoom) {
      setSelectedRoom(updated);
    }
  }, [rooms, selectedRoom]);

  const totalUnread = useMemo(() => {
    return rooms.reduce((sum, room) => {
      if (typeof room.unreadCount === "number") return sum + room.unreadCount;
      const fallback = room.members?.filter((m) => !m.lastReadAt)?.length || 0;
      return sum + fallback;
    }, 0);
  }, [rooms]);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setViewMode("CHAT");
  };

  const handleOpenWidget = () => {
    setOpen((prev) => !prev);
    if (!open) {
      setViewMode("LIST");
    }
  };

  if (!isLoggedIn) return null;
  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1400,
        }}
      >
        <Badge
          color="error"
          badgeContent={totalUnread}
          overlap="circular"
          sx={{
            "& .MuiBadge-badge": {
              fontWeight: 600,
              fontSize: "0.75rem",
              minWidth: "20px",
              height: "20px",
            },
          }}
        >
          <Fab
            color="primary"
            size="medium"
            onClick={handleOpenWidget}
            sx={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <FaComments size={20} />
          </Fab>
        </Badge>
      </Box>

      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper
          elevation={20}
          sx={{
            position: "fixed",
            zIndex: 1399,
            bottom: isMobile ? 12 : 80,
            right: isMobile ? 12 : 16,
            left: isMobile ? 12 : "auto",
            width: isMobile ? "calc(100% - 24px)" : 420,
            height: isMobile ? "75vh" : 560,
            borderRadius: 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {viewMode === "CHAT" && (
                <IconButton
                  size="small"
                  onClick={() => setViewMode("LIST")}
                  sx={{
                    color: "inherit",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.2)",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <FaArrowLeft size={14} />
                </IconButton>
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Messages
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {viewMode === "LIST" && (
                <Link href="/dashboard/chat" passHref legacyBehavior>
                  <IconButton
                    size="small"
                    component="a"
                    sx={{
                      color: "inherit",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.2)",
                        transform: "scale(1.1)",
                      },
                    }}
                    title="View All Chats"
                  >
                    <FaExternalLinkAlt size={14} />
                  </IconButton>
                </Link>
              )}
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                sx={{
                  color: "inherit",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.2)",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <FaTimes size={14} />
              </IconButton>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              p: isMobile ? 0 : 1,
            }}
          >
            {viewMode === "LIST" ? (
              <ChatRoomsList
                rooms={rooms}
                selectedRoomId={selectedRoom?.id}
                onSelectRoom={handleSelectRoom}
                onMuteRoom={() => {}}
                onArchiveRoom={() => {}}
                onDeleteRoom={() => {}}
                onLoadMore={loadMoreRooms}
                hasMore={page < totalPages}
                loading={roomsLoadingMore}
                initialLoading={roomsLoading}
                isWidget
              />
            ) : selectedRoom ? (
              <ChatWindow
                room={selectedRoom}
                onClose={() => setViewMode("LIST")}
                projectId={projectId}
                clientLeadId={clientLeadId}
                isMobile
                onRoomActivity={() => fetchRooms(0, false)}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  color: "textSecondary",
                }}
              >
                <Typography>Select a chat to start messaging</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Slide>
    </>
  );
}

export default ChatWidget;
