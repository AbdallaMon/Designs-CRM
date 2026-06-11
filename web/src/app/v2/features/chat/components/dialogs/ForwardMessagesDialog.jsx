"use client";

import { Box, Button, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useState } from "react";
import { ChatRoomsList } from "../rooms/ChatRoomsList.jsx";
import { useChatRooms } from "../../hooks";
import { useSocket } from "@/app/v2/providers/SocketProvider";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { chatEmit } from "../../chat.socket.js";

export function ForwardMessagesDialog({ open, onClose, selectedMessages }) {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const { socket } = useSocket();
  const { user } = useAuth();
  const {
    rooms,
    loading,
    initialLoading,
    loadMoreRooms,
    onSearchChange,
    onChatTypeChange,
    roomsEndRef,
    scrollContainerRef,
    loadingMore,
    hasMore,
  } = useChatRooms();

  function handleSelectRoom(room, isSelected) {
    setSelectedRooms((prev) =>
      isSelected ? prev.filter((r) => r.id !== room.id) : [...prev, room],
    );
  }

  function handleForwardMessages() {
    chatEmit.forwardMessages(socket, {
      roomsIds: selectedRooms.map((r) => r.id),
      messageIds: selectedMessages.map((m) => m.id),
      userId: user?.id,
    });
    setSelectedRooms([]);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Typography variant="h6" gutterBottom>
            إعادة توجيه {selectedMessages.length} رسالة
          </Typography>
          {selectedRooms.length > 0 && (
            <Button variant="contained" onClick={handleForwardMessages}>
              إعادة توجيه
            </Button>
          )}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ maxHeight: "80vh" }}>
        <ChatRoomsList
          rooms={rooms}
          onSelectForwardRoom={handleSelectRoom}
          isForward
          selectedForwardRooms={selectedRooms}
          loadMoreRooms={loadMoreRooms}
          hasMore={hasMore}
          loading={loading}
          initialLoading={initialLoading}
          loadingMore={loadingMore}
          onSearch={onSearchChange}
          onSelectChatType={onChatTypeChange}
          scrollContainerRef={scrollContainerRef}
          roomsEndRef={roomsEndRef}
        />
      </DialogContent>
    </Dialog>
  );
}
