"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { ChatRoomsList } from "./components/rooms/ChatRoomsList";
import { ChatWindow } from "./components/window/ChatWindow";
import { useChatRooms, useSocket } from "./hooks";
import { useAuth } from "@/app/providers/AuthProvider";
import { getData } from "@/app/helpers/functions/getData";
import { CHAT_ROOM_TYPES } from "./utils/chatConstants";
import { useRouter, useSearchParams } from "next/navigation";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { CreateGroupDialog } from "./components/dialogs";

export function ChatContainer({
  type = "page", // "page" | "widget" | "project" | "clientLead" | "tab"
  clientLeadId = null,
}) {
  const { user, isLoggedIn } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [viewMode, setViewMode] = useState("LIST"); // LIST | CHAT (mobile only)
  const [typingRooms, setTypingRooms] = useState({});
  const [widgetOpen, setWidgetOpen] = useState(false); // Widget only
  const isAdmin = checkIfAdmin(user);
  // ============================================
  // DATA FETCHING
  // ============================================
  const {
    rooms,
    loading: roomsLoading,
    initialLoading,
    loadingMore: roomsLoadingMore,
    createRoom,
    updateRoom,
    deleteRoom,
    fetchRooms,
    loadMoreRooms,
    totalPages,
    page,
    onSearchChange,
    onChatTypeChange,
    unreadCounts,
    setUnreadCounts,
    totalUnread,
    setTotalUnread,
    roomsEndRef,
    scrollContainerRef,
    leaveRoom,
    loadingMore,
    hasMore,
  } = useChatRooms({
    isTab: type === "tab",
    clientLeadId,
    category: null,
    widgetOpen,
    type,
  });
  // Message sound (widget only)
  const messageSoundRef = useRef(null);
  useEffect(() => {
    if (typeof Audio !== "undefined")
      messageSoundRef.current = new Audio("/message-sound.mp3");
  }, []);
  useSocket({
    onRoomCreatedNotification: (data) => {
      const { roomId, userId } = data;
      const id = searchParams?.get("roomId");
      if (roomId !== parseInt(id)) {
        fetchRooms(false);
      }
    },
    onRoomUpdated: (data) => {
      fetchRooms(false);
    },
    onMessagesReadNotification: (data) => {
      const { count, roomId } = data;
      setTotalUnread((prev) => Math.max(0, prev - count));
      setUnreadCounts((prev) => {
        const updated = { ...prev };
        updated[roomId] = 0;
        return updated;
      });
    },
    onNewMessageNotification: (data) => {
      fetchRooms(false);
      // Play sound in widget if message is from another user and not in selected room
      if (
        !data.isMuted &&
        messageSoundRef.current &&
        data.message.senderId !== user?.id &&
        data.roomId !== selectedRoom?.id
      ) {
        // setTotalUnread((prev) => prev + 1);
        messageSoundRef.current.play().catch((error) => {
          // Sound play error - continue anyway
        });
      }
    },
    onRoomDeletedNotification: (data) => {
      const { roomId } = data;
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null);
        if (type === "page" && isMobile) {
          setViewMode("LIST");
        }
        router.replace("?");
      }
      fetchRooms(false);
    },
    onTypingNotification: (data) => {
      // Only show typing if not in the room and not from self
      if (data.roomId !== selectedRoom?.id && data.userId !== user?.id) {
        setTypingRooms((prev) => {
          const next = new Set(prev[data.roomId] || []);
          next.add(data.userId);
          return { ...prev, [data.roomId]: next };
        });
      } else {
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

  // When rooms load, pick room from search params if present
  useEffect(() => {
    if (!rooms?.length || !roomIdFromParams) return;
    const match = rooms.find((r) => r.id === roomIdFromParams);
    if (match) {
      setSelectedRoom(match);
      if (isMobile) setViewMode("CHAT");
    } else {
      // clear searchPArams
      router.replace("?");
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
  function handleLeaveRoom(roomId) {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (targetRoom?.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF) return;
    leaveRoom(roomId);
    if (selectedRoom?.id === roomId) {
      setSelectedRoom(null);
      if (isMobile) setViewMode("LIST");
    }
  }

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    if (type === "page") {
      router.replace(`?roomId=${room.id}`);
    }
    if (isMobile) setViewMode("CHAT");
  };

  const handleOpenCreateRoom = () => {
    setCreateRoomOpen(true);
  };

  const renderChatRoomsList = () => (
    <ChatRoomsList
      rooms={rooms}
      selectedRoomId={selectedRoom?.id}
      onSelectRoom={handleSelectRoom}
      onMuteRoom={handleMuteRoom}
      onArchiveRoom={handleArchiveRoom}
      onDeleteRoom={handleDeleteRoom}
      onCreateNewRoom={handleOpenCreateRoom}
      loadMoreRooms={loadMoreRooms}
      hasMore={hasMore}
      loading={roomsLoading}
      initialLoading={initialLoading}
      loadingMore={loadingMore}
      isWidget={type === "widget"}
      typingRooms={typingRooms}
      onSearch={(search) => onSearchChange(search)}
      onSelectChatType={(chatType) => onChatTypeChange(chatType)}
      unreadCounts={unreadCounts}
      scrollContainerRef={scrollContainerRef}
      roomsEndRef={roomsEndRef}
      onLeaveRoom={handleLeaveRoom}
      isTab={type === "tab"}
      clientLeadId={clientLeadId}
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
        clientLeadId={clientLeadId}
        isMobile={isMobile || type === "widget"}
        onRoomActivity={() => fetchRooms(false)}
        reFetchRooms={() => fetchRooms(false)}
        setTotalUnread={setTotalUnread}
        isTab={type === "tab"}
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

  // ============================================
  // RENDER BY TYPE
  // ============================================

  // Widget UI
  if (type === "widget") {
    if (!isLoggedIn) return null;

    return (
      <RenderWidgetChat
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        type={type}
        isMobile={isMobile}
        router={router}
        renderChatRoomsList={renderChatRoomsList}
        renderChatWindow={renderChatWindow}
        totalUnread={totalUnread}
        setWidgetOpen={setWidgetOpen}
        widgetOpen={widgetOpen}
        isAdmin={isAdmin}
        clientLeadId={clientLeadId}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        createRoomOpen={createRoomOpen}
        setCreateRoomOpen={setCreateRoomOpen}
      />
    );
  }

  // Page UI (default)
  if (type === "page") {
    return (
      <RenderPageChat
        isMobile={isMobile}
        router={router}
        renderChatRoomsList={renderChatRoomsList}
        renderChatWindow={renderChatWindow}
        clientLeadId={clientLeadId}
        isAdmin={isAdmin}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        type={type}
        selectedRoom={selectedRoom}
        setViewMode={setViewMode}
        createRoomOpen={createRoomOpen}
        setCreateRoomOpen={setCreateRoomOpen}
        viewMode={viewMode}
        setSelectedRoom={setSelectedRoom}
      />
    );
  }
  if (type === "tab") {
    return (
      <RenderTabChat
        isMobile={isMobile}
        router={router}
        renderChatRoomsList={renderChatRoomsList}
        renderChatWindow={renderChatWindow}
        clientLeadId={clientLeadId}
        isAdmin={isAdmin}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        type={type}
        selectedRoom={selectedRoom}
        setViewMode={setViewMode}
        createRoomOpen={createRoomOpen}
        setCreateRoomOpen={setCreateRoomOpen}
        viewMode={viewMode}
        setSelectedRoom={setSelectedRoom}
      />
    );
  }

  // Default fallback
  return null;
}
function RenderWidgetChat({
  selectedRoom,
  setSelectedRoom,
  type,
  isMobile,
  router,
  renderChatRoomsList,
  renderChatWindow,
  totalUnread,
  setWidgetOpen,
  isAdmin,
  clientLeadId,
  createRoom,
  fetchRooms,
  createRoomOpen,
  setCreateRoomOpen,
  widgetOpen,
}) {
  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          right: 20,
          zIndex: 1400,
        }}
      >
        <Badge
          color="error"
          badgeContent={totalUnread}
          overlap="circular"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            "& .MuiBadge-badge": {
              fontWeight: 600,
              fontSize: "0.75rem",
              minWidth: "20px",
              height: "20px",
              right: 0,
              top: 0,
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
          elevation={24}
          sx={{
            position: "fixed",
            zIndex: 1000,
            bottom: isMobile ? 12 : 80,
            right: isMobile ? 12 : 16,
            left: isMobile ? 12 : "auto",
            width: isMobile ? "calc(100% - 24px)" : 420,
            height: isMobile ? "75vh" : 640,
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
            <Stack direction="row" spacing={1}>
              <Link
                href={
                  selectedRoom && selectedRoom?.id
                    ? `/dashboard/chat?roomId=${selectedRoom.id}`
                    : `/dashboard/chat`
                }
                passHref
                legacyBehavior
              >
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
            {selectedRoom && renderChatWindow()}
            <Box
              sx={{
                display: selectedRoom ? "none" : "block",
                overflow: "auto",
                flex: 1,
              }}
            >
              {renderChatRoomsList()}
            </Box>
          </Box>
        </Paper>
      </Slide>
      <CreateGroupDialog
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        clientLeadId={clientLeadId}
        isAdmin={isAdmin}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        onCreated={(room) => {
          setSelectedRoom(room);
          if (isMobile) setViewMode("CHAT");
          if (type === "page") router.replace(`?roomId=${room.id}`);
        }}
      />
    </>
  );
}
function RenderPageChat({
  isMobile,
  router,
  renderChatRoomsList,
  renderChatWindow,
  clientLeadId,
  isAdmin,
  createRoom,
  fetchRooms,
  type,
  selectedRoom,
  setViewMode,
  createRoomOpen,
  setCreateRoomOpen,
  viewMode,
  setSelectedRoom,
}) {
  return (
    <Box
      sx={{
        // height: { xs: "calc(100vh - 62px)", md: "calc(100vh - 88px)" },
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.50",
      }}
    >
      {isMobile ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* {viewMode === "LIST" && ( */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              pt: 1,
              display: selectedRoom ? "none" : "block",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                height: "calc(100vh - 78px)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                display: viewMode === "LIST" ? "block" : "none",
              }}
            >
              {renderChatRoomsList()}
            </Paper>
          </Box>
          {/* )} */}

          {viewMode === "CHAT" && (
            <Box sx={{ flex: 1, p: 0 }}>{renderChatWindow()}</Box>
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
                height: "calc(100vh - 120px)",
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

          <Grid size={{ xs: 12, md: 9 }} sx={{ height: "calc(100vh - 120px)" }}>
            {renderChatWindow()}
          </Grid>
        </Grid>
      )}
      <CreateGroupDialog
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        clientLeadId={clientLeadId}
        isAdmin={isAdmin}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        onCreated={(room) => {
          setSelectedRoom(room);
          if (isMobile) setViewMode("CHAT");
          if (type === "page") router.replace(`?roomId=${room.id}`);
        }}
      />{" "}
    </Box>
  );
}
function RenderTabChat({
  isMobile,
  router,
  renderChatRoomsList,
  renderChatWindow,
  clientLeadId,
  isAdmin,
  createRoom,
  fetchRooms,
  type,
  selectedRoom,
  setViewMode,
  viewMode,
  createRoomOpen,
  setCreateRoomOpen,
  setSelectedRoom,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.50",
      }}
    >
      {isMobile ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              flex: 1,
              p: 2,
              pt: 1,
              display: selectedRoom ? "none" : "block",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                height: "calc(100vh - 78px)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                display: viewMode === "LIST" ? "block" : "none",
              }}
            >
              {renderChatRoomsList()}
            </Paper>
          </Box>
          {/* )} */}

          {viewMode === "CHAT" && (
            <Box sx={{ flex: 1, p: 0 }}>{renderChatWindow()}</Box>
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
                height: "calc(100vh - 120px)",
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

          <Grid size={{ xs: 12, md: 9 }} sx={{ height: "calc(100vh - 120px)" }}>
            {renderChatWindow()}
          </Grid>
        </Grid>
      )}
      {/* <CreateGroupDialog
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        clientLeadId={clientLeadId}
        isAdmin={isAdmin}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        onCreated={(room) => {
          setSelectedRoom(room);
          if (isMobile) setViewMode("CHAT");
          if (type === "page") router.replace(`?roomId=${room.id}`);
        }}
      />{" "} */}
    </Box>
  );
}
export default ChatContainer;
