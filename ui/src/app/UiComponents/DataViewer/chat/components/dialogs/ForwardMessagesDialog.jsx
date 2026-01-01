"use client";

import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { ChatRoomsList } from "../rooms";
import { useChatRooms } from "../../hooks";
import { forwardMultipleMessages } from "../../utils/socketIO";

export function ForwardMessagesDialog({ open, onClose, selectedMessages }) {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const {
    rooms,
    loading: roomsLoading,
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
    if (isSelected) {
      setSelectedRooms((prev) => prev.filter((r) => r.id !== room.id));
    } else {
      setSelectedRooms((prev) => [...prev, room]);
    }
  }
  function handleForwardMessages() {
    forwardMultipleMessages({
      roomsIds: selectedRooms.map((r) => r.id),
      messageIds: selectedMessages.map((m) => m.id),
    });
    setSelectedRooms([]);
    onClose();
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Forward {selectedMessages.length} Message
            {selectedMessages.length > 1 ? "s" : ""}
          </Typography>
          {selectedRooms.length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleForwardMessages}
            >
              Forward
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          maxHeight: "80vh",
        }}
      >
        <ChatRoomsList
          rooms={rooms}
          onSelectForwardRoom={handleSelectRoom}
          isForward={true}
          selectedForwardRooms={selectedRooms}
          loadMoreRooms={loadMoreRooms}
          hasMore={hasMore}
          loading={roomsLoading}
          initialLoading={initialLoading}
          loadingMore={loadingMore}
          onSearch={(search) => onSearchChange(search)}
          onSelectChatType={(chatType) => onChatTypeChange(chatType)}
          scrollContainerRef={scrollContainerRef}
          roomsEndRef={roomsEndRef}
        />
      </DialogContent>
    </Dialog>
  );
}
