"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  Badge,
  Fab,
  IconButton,
  Slide,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  FaArrowLeft,
  FaComments,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";
import Link from "next/link";
import { ChatRoomsList } from "./components/ChatRoomsList";
import { ChatWindow } from "./components/ChatWindow";
import { useChatRooms, useSocket } from "./hooks";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { getData } from "@/app/helpers/functions/getData";
import { CHAT_ROOM_TYPES } from "./utils/chatConstants";
import { useRouter, useSearchParams } from "next/navigation";
import { joinChatRoom } from "./utils/socketIO";

/**
 * Unified Chat Container Component
 * Handles all chat logic and renders different UIs based on type
 *
 * Types:
 * - "page": Full page chat (for /dashboard/chat)
 * - "widget": Floating chat widget (bottom right)
 * - "project": Project-specific chat
 * - "clientLead": Client lead chat
 */
export function ChatContainer({
  type = "page", // "page" | "widget" | "project" | "clientLead"
  projectId = null,
  clientLeadId = null,
}) {
  return;
  const { user, isLoggedIn } = useAuth();
  const { setLoading: setToastLoading } = useToastContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const searchParams = useSearchParams();

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState(CHAT_ROOM_TYPES.PROJECT_GROUP);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState("LIST"); // LIST | CHAT (mobile only)
  const [typingRooms, setTypingRooms] = useState({});
  const [widgetOpen, setWidgetOpen] = useState(false); // Widget only

  // ============================================
  // DATA FETCHING
  // ============================================
  const {
    rooms,
    loading: roomsLoading,
    loadingMore: roomsLoadingMore,
    createRoom,
    updateRoom,
    deleteRoom,
    fetchRooms,
    loadMoreRooms,
    totalPages,
    page,
  } = useChatRooms({ projectId, category: null, limit: 25 });

  // Message sound (widget only)
  const messageSound =
    type === "widget" && typeof Audio !== "undefined"
      ? new Audio("/message-sound.mp3")
      : null;

  useSocket({
    onMessagesReadNotification: (data) => {
      const { roomId, userId, messageId } = data;
      const id = searchParams?.get("roomId");

      if (roomId !== parseInt(id) && user?.id === userId) {
        fetchRooms(0, false);
      }
    },
    onNewMessageNotification: (data) => {
      fetchRooms(0, false);

      // Play sound in widget if message is from another user and not in selected room
      if (
        messageSound &&
        data.senderId !== user?.id &&
        data.roomId !== selectedRoom?.id
      ) {
        messageSound.play().catch((error) => {
          // Sound play error - continue anyway
        });
      }
    },
    onTypingNotification: (data) => {
      console.log("⌨️ ChatContainer - onTyping:", data);
      console.log(
        "Current room:",
        selectedRoom?.id,
        "Typing room:",
        data.roomId
      );
      // Only show typing if not in the room and not from self
      if (data.roomId !== selectedRoom?.id && data.userId !== user?.id) {
        console.log("✅ Adding typing indicator for room", data.roomId);
        setTypingRooms((prev) => {
          const roomTyping = prev[data.roomId] || new Set();
          if (roomTyping instanceof Set) {
            roomTyping.add(data.userId);
          } else {
            const newSet = new Set();
            newSet.add(data.userId);
            return { ...prev, [data.roomId]: newSet };
          }
          return { ...prev, [data.roomId]: roomTyping };
        });
      } else {
        console.log("❌ Ignoring typing (same room or self)");
      }
    },
    onStopTypingNotification: (data) => {
      setTypingRooms((prev) => {
        const roomTyping = prev[data.roomId];
        if (!roomTyping) return prev;

        if (roomTyping instanceof Set) {
          roomTyping.delete(data.userId);
          if (roomTyping.size === 0) {
            const updated = { ...prev };
            delete updated[data.roomId];
            return updated;
          }
          return { ...prev, [data.roomId]: roomTyping };
        } else {
          const updated = { ...prev };
          updated[data.roomId] -= 1;
          if (updated[data.roomId] <= 0) {
            delete updated[data.roomId];
          }
          return updated;
        }
      });
    },
  });

  const roomIdFromParams = useMemo(() => {
    if (type !== "page") return null;
    const id = searchParams?.get("roomId");
    return id ? Number(id) : null;
  }, [searchParams, type]);

  useEffect(() => {
    if (createRoomOpen) {
      loadAvailableUsers();
    }
  }, [createRoomOpen]);

  // When rooms load, pick room from search params if present
  useEffect(() => {
    if (!rooms?.length || !roomIdFromParams) return;
    const match = rooms.find((r) => r.id === roomIdFromParams);
    if (match) {
      setSelectedRoom(match);
      if (isMobile) setViewMode("CHAT");
    }
  }, [rooms, roomIdFromParams, isMobile]);

  // Update selected room when rooms change
  useEffect(() => {
    if (!selectedRoom) return;
    const updated = rooms.find((r) => r.id === selectedRoom.id);
    if (updated && updated !== selectedRoom) {
      setSelectedRoom(updated);
    }
  }, [rooms, selectedRoom]);

  // ============================================
  // HANDLERS
  // ============================================

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      let url = `admin/all-users?`;
      if (projectId) url += `projectId=${projectId}&`;
      const response = await getData({
        url,
        setLoading: () => {},
      });
      if (response?.status === 200) {
        setAvailableUsers(response.data || []);
      }
    } catch (err) {
      // Error loading users
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    setCreating(true);
    const normalizedType = CHAT_ROOM_TYPES.PROJECT_GROUP;

    const roomData = {
      name: roomName,
      type: normalizedType,
      projectId,
      clientLeadId,
      userIds: selectedUsers.map((u) => u.id),
    };

    const result = await createRoom(roomData);
    if (result) {
      setCreateRoomOpen(false);
      setRoomName("");
      setSelectedUsers([]);
      setSelectedRoom(result);
      if (isMobile) setViewMode("CHAT");
    }
    setCreating(false);
  };

  const handleMuteRoom = async (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    await updateRoom(roomId, { isMuted: !room?.isMuted });
  };

  const handleArchiveRoom = async (roomId) => {
    const room = rooms.find((r) => r.id === roomId);
    await updateRoom(roomId, { isArchived: !room?.isArchived });
  };

  const handleDeleteRoom = async (roomId) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (targetRoom?.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF) return;

    await deleteRoom(roomId);
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null);
      if (isMobile) setViewMode("LIST");
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    if (type === "page") {
      router.replace(`?roomId=${room.id}`);
    }
    if (isMobile) setViewMode("CHAT");
  };

  const handleOpenCreateRoom = () => {
    setRoomType(CHAT_ROOM_TYPES.PROJECT_GROUP);
    setCreateRoomOpen(true);
  };

  // Calculate total unread for widget
  const totalUnread = useMemo(() => {
    return rooms.reduce((total, room) => {
      const unread =
        typeof room.unreadCount === "number"
          ? room.unreadCount
          : room.members?.filter((m) => !m.lastReadAt)?.length || 0;
      return total + unread;
    }, 0);
  }, [rooms]);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderChatRoomsList = () => (
    <ChatRoomsList
      rooms={rooms}
      selectedRoomId={selectedRoom?.id}
      onSelectRoom={handleSelectRoom}
      onMuteRoom={handleMuteRoom}
      onArchiveRoom={handleArchiveRoom}
      onDeleteRoom={handleDeleteRoom}
      onCreateNewRoom={handleOpenCreateRoom}
      onLoadMore={loadMoreRooms}
      hasMore={page < totalPages}
      loading={roomsLoadingMore}
      initialLoading={roomsLoading}
      isWidget={type === "widget"}
      typingRooms={typingRooms}
    />
  );

  const renderChatWindow = () =>
    selectedRoom ? (
      <ChatWindow
        room={selectedRoom}
        onClose={() => {
          if (type === "widget") {
            setViewMode("LIST");
            setSelectedRoom(null);
            router.replace("?");
          } else if (type === "page" && isMobile) {
            setViewMode("LIST");
            setSelectedRoom(null);
            router.replace("?");
          } else {
            setSelectedRoom(null);
          }
        }}
        projectId={projectId}
        clientLeadId={clientLeadId}
        isMobile={isMobile || type === "widget"}
        onRoomActivity={() => fetchRooms(0, false)}
      />
    ) : (
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          bgcolor: "grey.50",
          borderRadius: 3,
        }}
      >
        <Typography color="textSecondary" variant="body1">
          {type === "widget"
            ? "Select a chat to start messaging"
            : "Select a chat or create a new one to start messaging"}
        </Typography>
      </Paper>
    );

  const renderCreateRoomDialog = () => (
    <Dialog
      open={createRoomOpen}
      onClose={() => setCreateRoomOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        },
      }}
    >
      <DialogTitle>Create New Chat</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Group Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter group name"
          />

          <FormControl fullWidth>
            <InputLabel>Add Members</InputLabel>
            <Select
              multiple
              value={selectedUsers}
              onChange={(e) => setSelectedUsers(e.target.value)}
              label="Add Members"
              disabled={loadingUsers}
            >
              {availableUsers.map((u) => (
                <MenuItem key={u.id} value={u}>
                  {u.name} - {u.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateRoomOpen(false)}>Cancel</Button>
        <Button
          onClick={handleCreateRoom}
          variant="contained"
          disabled={!roomName.trim() || creating}
          sx={{
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.02)",
            },
          }}
        >
          {creating ? <CircularProgress size={20} color="inherit" /> : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============================================
  // RENDER BY TYPE
  // ============================================

  // Widget UI
  if (type === "widget") {
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
              onClick={() => setWidgetOpen((prev) => !prev)}
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

        <Slide direction="up" in={widgetOpen} mountOnEnter unmountOnExit>
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
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {selectedRoom ? selectedRoom.name : "Messages"}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                {!selectedRoom && (
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
                  onClick={() => {
                    setWidgetOpen(false);
                    setSelectedRoom(null);
                  }}
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
                overflow: "hidden",
              }}
            >
              {selectedRoom ? renderChatWindow() : renderChatRoomsList()}
            </Box>
          </Paper>
        </Slide>

        {renderCreateRoomDialog()}
      </>
    );
  }

  // Page UI (default)
  if (type === "page") {
    return (
      <Box
        sx={{
          height: "calc(100vh - 100px)",
          display: "flex",
          flexDirection: "column",
          bgcolor: "grey.50",
        }}
      >
        {isMobile ? (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {viewMode === "LIST" && (
              <Box sx={{ flex: 1, p: 2, pt: 1 }}>
                <Paper
                  elevation={3}
                  sx={{
                    height: "calc(100vh - 100px)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                >
                  {renderChatRoomsList()}
                </Paper>
              </Box>
            )}

            {viewMode === "CHAT" && (
              <Box sx={{ flex: 1, p: 0, height: "calc(100vh - 100px)" }}>
                {renderChatWindow()}
              </Box>
            )}
          </Box>
        ) : (
          <Grid
            container
            spacing={2}
            sx={{ flex: 1, height: "100%", p: 2, m: 0, width: "100%" }}
          >
            <Grid size={{ xs: 12, md: 3 }} sx={{ height: "100%" }}>
              <Paper
                elevation={3}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                {renderChatRoomsList()}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 9 }} sx={{ height: "100%" }}>
              {renderChatWindow()}
            </Grid>
          </Grid>
        )}

        {renderCreateRoomDialog()}
      </Box>
    );
  }

  // Default fallback
  return null;
}

export default ChatContainer;
