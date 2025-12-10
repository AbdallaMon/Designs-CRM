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
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { ChatRoomsList } from "./components/ChatRoomsList";
import { ChatWindow } from "./components/ChatWindow";
import { useChatRooms } from "./hooks/useChatRooms";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { getData } from "@/app/helpers/functions/getData";
import { CHAT_ROOM_TYPES } from "./utils/chatConstants";
import { useRouter, useSearchParams } from "next/navigation";
import { initSocket } from "./utils/socketIO";

export default function ChatPage({ projectId = null, clientLeadId = null }) {
  return;
  const { user } = useAuth();
  const { setLoading: setToastLoading } = useToastContext();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState(CHAT_ROOM_TYPES.PROJECT_GROUP);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState("LIST"); // LIST | CHAT (mobile only)

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

  // Pre-select room from search params
  const roomIdFromParams = useMemo(() => {
    const id = searchParams?.get("roomId");
    return id ? Number(id) : null;
  }, [searchParams]);

  useEffect(() => {
    if (createRoomOpen) {
      loadAvailableUsers();
    }
  }, [createRoomOpen]);

  // Global listener: refetch rooms on any new message so all participants stay up to date
  // useEffect(() => {
  //   const socket = initSocket(process.env.NEXT_PUBLIC_URL);
  //   const handleMessageCreated = () => {
  //     fetchRooms(0, false);
  //   };

  //   socket?.on("message:created", handleMessageCreated);

  //   return () => {
  //     socket?.off("message:created", handleMessageCreated);
  //   };
  // }, [fetchRooms]);

  // When rooms load, pick room from search params if present
  useEffect(() => {
    if (!rooms?.length) return;
    if (roomIdFromParams) {
      const match = rooms.find((r) => r.id === roomIdFromParams);
      if (match) {
        setSelectedRoom(match);
        if (isMobile) setViewMode("CHAT");
      }
    }
  }, [rooms, roomIdFromParams, isMobile]);

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
      console.error("Error loading users:", err);
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
    router.replace(`?roomId=${room.id}`);
    if (isMobile) setViewMode("CHAT");
  };

  useEffect(() => {
    if (!selectedRoom) return;
    const updated = rooms.find((r) => r.id === selectedRoom.id);
    if (updated && updated !== selectedRoom) {
      setSelectedRoom(updated);
    }
  }, [rooms, selectedRoom]);

  const handleOpenCreateRoom = () => {
    setRoomType(CHAT_ROOM_TYPES.PROJECT_GROUP);
    setCreateRoomOpen(true);
  };

  return (
    <Box
      sx={{
        height: "80vh",
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
                  height: "calc(80vh - 140px)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
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
                />
              </Paper>
            </Box>
          )}

          {viewMode === "CHAT" && (
            <Box sx={{ flex: 1, p: 0 }}>
              {selectedRoom ? (
                <ChatWindow
                  room={selectedRoom}
                  onClose={() => {
                    setViewMode("LIST");
                    setSelectedRoom(null);
                    router.replace("?");
                  }}
                  projectId={projectId}
                  clientLeadId={clientLeadId}
                  isMobile
                  onRoomActivity={() => fetchRooms(0, false)}
                />
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "calc(80vh - 48px)",
                    bgcolor: "grey.50",
                  }}
                >
                  <Typography color="textSecondary" variant="body1">
                    Select a chat to start messaging
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <Grid
          container
          spacing={2}
          sx={{ flex: 1, height: "100%", p: 2, m: 0, width: "100%" }}
        >
          {/* Left sidebar - Chat rooms list */}
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
              />
            </Paper>
          </Grid>

          {/* Right side - Chat window */}
          <Grid size={{ xs: 12, md: 9 }} sx={{ height: "100%" }}>
            {selectedRoom ? (
              <ChatWindow
                room={selectedRoom}
                onClose={() => setSelectedRoom(null)}
                projectId={projectId}
                clientLeadId={clientLeadId}
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
                  Select a chat or create a new one to start messaging
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* Create Room Dialog */}
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
            {creating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
