"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Paper, Typography, useMediaQuery, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatRoomsList } from "../rooms/ChatRoomsList.jsx";
import { ChatWindow } from "../window/ChatWindow.jsx";
import { CreateGroupDialog } from "../dialogs/CreateGroupDialog.jsx";
import { useChatRooms } from "../../hooks";
import { useChatSocket } from "../../chat.socket.js";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { CHAT_ROOM_TYPES } from "../../config/chatConstants.js";

/**
 * Page-mode chat container. Realtime room-list updates, URL-driven room selection
 * (?roomId=), and gated create. Mirrors the legacy ChatContainer (page type) behavior.
 */
export function ChatContainer() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canCreate = hasPermission(PERMISSIONS.CHAT.ROOM_CREATE);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [viewMode, setViewMode] = useState("LIST");
  const [typingRooms, setTypingRooms] = useState({});

  const {
    rooms,
    loading: roomsLoading,
    initialLoading,
    createRoom,
    updateRoom,
    deleteRoom,
    fetchRooms,
    loadMoreRooms,
    onSearchChange,
    onChatTypeChange,
    unreadCounts,
    setUnreadCounts,
    setTotalUnread,
    roomsEndRef,
    scrollContainerRef,
    leaveRoom,
    loadingMore,
    hasMore,
  } = useChatRooms({});

  useChatSocket({
    onRoomCreatedNotification: (data) => {
      const id = searchParams?.get("roomId");
      if (data.roomId !== parseInt(id, 10)) fetchRooms();
    },
    onRoomUpdated: () => fetchRooms(),
    onMessagesReadNotification: ({ count, roomId }) => {
      setTotalUnread((prev) => Math.max(0, prev - count));
      setUnreadCounts((prev) => ({ ...prev, [roomId]: 0 }));
    },
    onNewMessageNotification: () => fetchRooms(),
    onRoomDeletedNotification: ({ roomId }) => {
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
        if (isMobile) setViewMode("LIST");
        router.replace("?");
      }
      fetchRooms();
    },
    onTypingNotification: (data) => {
      if (data.roomId !== selectedRoomId && data.userId !== user?.id) {
        setTypingRooms((prev) => {
          const next = new Set(prev[data.roomId] || []);
          next.add(data.userId);
          return { ...prev, [data.roomId]: next };
        });
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
        }
        return prev;
      });
    },
  });

  const roomIdFromParams = useMemo(() => {
    const id = searchParams?.get("roomId");
    return id ? Number(id) : null;
  }, [searchParams]);

  useEffect(() => {
    if (roomIdFromParams) {
      setSelectedRoomId(roomIdFromParams);
      if (isMobile) setViewMode("CHAT");
    }
  }, [rooms, roomIdFromParams, isMobile]);

  const handleMuteRoom = async (roomId, isMuted) => updateRoom(roomId, { isMuted });
  const handleArchiveRoom = async (roomId, isArchived) => updateRoom(roomId, { isArchived });

  const handleDeleteRoom = async (roomId) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (targetRoom?.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF) return;
    await deleteRoom(roomId);
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      if (isMobile) setViewMode("LIST");
    }
  };

  const handleLeaveRoom = async (roomId) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (targetRoom?.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF) return;
    // pass selfMember.id when the list row carries it; the hook fetches room detail otherwise
    await leaveRoom(roomId, targetRoom?.selfMember?.id ?? null);
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      if (isMobile) setViewMode("LIST");
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoomId(room.id);
    router.replace(`?roomId=${room.id}`);
    if (isMobile) setViewMode("CHAT");
  };

  const roomsList = (
    <ChatRoomsList
      rooms={rooms}
      selectedRoomId={selectedRoomId}
      onSelectRoom={handleSelectRoom}
      onMuteRoom={handleMuteRoom}
      onArchiveRoom={handleArchiveRoom}
      onDeleteRoom={handleDeleteRoom}
      onCreateNewRoom={() => setCreateRoomOpen(true)}
      onLeaveRoom={handleLeaveRoom}
      loadMoreRooms={loadMoreRooms}
      hasMore={hasMore}
      loading={roomsLoading}
      initialLoading={initialLoading}
      loadingMore={loadingMore}
      typingRooms={typingRooms}
      onSearch={onSearchChange}
      onSelectChatType={onChatTypeChange}
      unreadCounts={unreadCounts}
      scrollContainerRef={scrollContainerRef}
      roomsEndRef={roomsEndRef}
      canCreate={canCreate}
    />
  );

  const chatWindow = selectedRoomId ? (
    <ChatWindow
      roomId={selectedRoomId}
      onClose={() => {
        if (isMobile) {
          setViewMode("LIST");
          setSelectedRoomId(null);
          router.replace("?");
        } else {
          setSelectedRoomId(null);
        }
      }}
      isMobile={isMobile}
      onRoomActivity={() => fetchRooms()}
      reFetchRooms={() => fetchRooms()}
    />
  ) : (
    <Paper elevation={0} sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", bgcolor: "grey.50", borderRadius: 3 }}>
      <Typography color="textSecondary" variant="body1">
        اختر محادثة أو أنشئ واحدة جديدة لبدء المراسلة
      </Typography>
    </Paper>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", bgcolor: "grey.50" }}>
      {isMobile ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ flex: 1, p: 2, pt: 1, display: selectedRoomId ? "none" : "block" }}>
            <Paper elevation={3} sx={{ height: "calc(100vh - 78px)", overflow: "hidden", display: viewMode === "LIST" ? "block" : "none", borderRadius: 3 }}>
              {roomsList}
            </Paper>
          </Box>
          {viewMode === "CHAT" && <Box sx={{ flex: 1, p: 0 }}>{chatWindow}</Box>}
        </Box>
      ) : (
        <Grid container spacing={2} sx={{ flex: 1, height: "100%", p: 2, m: 0, width: "100%" }}>
          <Grid size={{ xs: 12, md: 3 }} sx={{ height: "100%" }}>
            <Paper elevation={3} sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: 3 }}>
              {roomsList}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 9 }} sx={{ height: "calc(100vh - 120px)" }}>
            {chatWindow}
          </Grid>
        </Grid>
      )}

      {canCreate && (
        <CreateGroupDialog
          open={createRoomOpen}
          onClose={() => setCreateRoomOpen(false)}
          createRoom={createRoom}
          onCreated={(room) => {
            setSelectedRoomId(room.id);
            if (isMobile) setViewMode("CHAT");
            router.replace(`?roomId=${room.id}`);
          }}
        />
      )}
    </Box>
  );
}

export default ChatContainer;
