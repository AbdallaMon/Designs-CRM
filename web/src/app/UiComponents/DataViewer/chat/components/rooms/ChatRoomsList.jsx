"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Chip,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Stack,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  FaSearch,
  FaEllipsisV,
  FaBell,
  FaBellSlash,
  FaArchive,
  FaTrash,
  FaPlus,
  FaExternalLinkAlt,
  FaCheck,
} from "react-icons/fa";
import {
  CHAT_ROOM_TYPE_LABELS,
  CHAT_ROOM_TYPES,
} from "../../utils/chatConstants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ChatChips from "./ChatChips";
import { LastSeenAt, OnlineStatus } from "../members";
import { ScrollButton } from "../messages";
import { StartNewChat } from "../dialogs";
import { getRoomAvatar, getRoomLabel } from "./helpers";
import { useAuth } from "@/app/providers/AuthProvider";
import { RoomActions } from "./RoomActions";
import { LoadMoreButton } from "../indicators/LoadMoreButton";

dayjs.extend(relativeTime);

export function ChatRoomsList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onMuteRoom,
  onArchiveRoom,
  onDeleteRoom,
  onCreateNewRoom,
  onLeaveRoom,

  hasMore = false,
  isWidget = false,
  typingRooms = {},
  onSearch,
  onSelectChatType,
  unreadCounts,
  roomsEndRef,
  scrollContainerRef,
  initialLoading,
  loading,
  loadingMore,
  loadMoreRooms,
  isTab = false,
  clientLeadId = null,
  isForward = false,
  selectedForwardRooms = [],
  onSelectForwardRoom,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRoomId, setMenuRoomId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const DEBOUNCE_MS = 450;
  const cantLoadMore = !hasMore || loading || loadingMore || initialLoading;
  const { user } = useAuth();
  // Debounce utility with cancel/flush controls
  function debounce(fn, wait) {
    let t;
    const debounced = (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
    debounced.cancel = () => clearTimeout(t);
    debounced.flush = (...args) => {
      clearTimeout(t);
      fn(...args);
    };
    return debounced;
  }

  const debouncedSearch = useMemo(
    () => debounce(onSearch, DEBOUNCE_MS),
    [onSearch]
  );

  const handleMenuOpen = (e, roomId) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuRoomId(roomId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuRoomId(null);
  };

  const handleDeleteRoom = () => {
    onDeleteRoom(menuRoomId);
    handleMenuClose();
    setDeleteConfirm(false);
  };
  const handleLeaveRoom = () => {
    onLeaveRoom(menuRoomId);
    handleMenuClose();
    setLeaveConfirm(false);
  };

  const getLastMessageText = (room) => {
    // Show typing indicator if someone is typing in this room and it's not the selected room
    if (typingRooms[room.id]) {
      // Handle both Set and old number format
      const typingCount =
        typingRooms[room.id] instanceof Set
          ? typingRooms[room.id].size
          : typingRooms[room.id];

      if (typingCount > 0) {
        return (
          <Typography
            variant="caption"
            sx={{ fontStyle: "italic", color: "primary.main", fontWeight: 500 }}
          >
            {typingCount} {typingCount === 1 ? "person is" : "people are"}{" "}
            typing...
          </Typography>
        );
      }
    }

    const last = room.lastMessage;
    if (!last) return "No messages yet";
    if (last.type === "FILE") return last.fileName || "File";
    const text = last.content || "";
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  };

  const getUnreadCount = (room) => {
    return unreadCounts?.[room.id] || 0;
  };

  useEffect(() => {
    return () => debouncedSearch.cancel?.();
  }, [debouncedSearch]);
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Header with new chat button (group only) */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {!isTab && !isForward && <StartNewChat />}
        {!isWidget && !isForward && (
          <Box sx={{ display: "flex" }}>
            <Button
              color="primary"
              onClick={onCreateNewRoom}
              size="small"
              variant="outlined"
            >
              <FaPlus />
              {isTab ? "Group Chat" : "Group"}
            </Button>
          </Box>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ p: 2, pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => {
            const v = e.target.value;
            setSearchQuery(v);
            debouncedSearch(v.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const q = searchQuery.trim();
              debouncedSearch.flush?.(q);
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch size={14} />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "action.hover",
              },
              "&.Mui-focused": {
                bgcolor: "background.paper",
              },
            },
          }}
        />
      </Box>
      {!isForward && (
        <Box>
          <ChatChips onSelect={onSelectChatType} isTab={isTab} />
        </Box>
      )}

      {/* Rooms list */}
      <List
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          overflow: "auto",
          position: "relative",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "3px",
          },
        }}
      >
        {/* Scroll to top button */}
        <ScrollButton
          containerRef={scrollContainerRef}
          direction="up"
          threshold={300}
          position={{ top: 8, right: 8 }}
        />
        {rooms?.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
            <Typography color="textSecondary">No chats found</Typography>
          </Box>
        ) : (
          rooms?.map((room) => {
            const member = room?.members.find((m) => m.userId === user.id);
            const isMuted = member?.isMuted;
            const isArchived = member?.isArchived;
            const unReadCount = getUnreadCount(room);
            const roomLabel = getRoomLabel(room);
            const isSelected = selectedForwardRooms?.find(
              (r) => r.id === room.id
            );
            return (
              <ListItem
                key={room.id}
                disablePadding
                sx={{
                  bgcolor: isSelected
                    ? "action.selected"
                    : selectedRoomId === room.id
                    ? "action.selected"
                    : unReadCount > 0
                    ? "primary.lighter"
                    : "transparent",
                  "&:hover": {
                    bgcolor: "action.hover",
                    "& .MuiIconButton-root": {
                      opacity: 1,
                    },
                  },
                  transition: "all 0.2s ease-in-out",
                  borderLeft:
                    selectedRoomId === room.id
                      ? "3px solid"
                      : unReadCount > 0
                      ? "3px solid error.main"
                      : "3px solid transparent",
                  borderLeftColor: "primary.main",
                }}
                secondaryAction={
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    {!isForward && (
                      <Tooltip title="Open chat in new window">
                        <IconButton
                          edge="start"
                          size="small"
                          sx={{
                            opacity: 0.5,
                            transition: "opacity 0.2s ease",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = new URL(
                              window.location.origin + "/dashboard/chat"
                            );
                            url.searchParams.set("roomId", room.id);
                            url.searchParams.set("getRoom", "true");
                            window.open(url.toString(), "_blank");
                          }}
                        >
                          <FaExternalLinkAlt size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!isForward && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleMenuOpen(e, room.id)}
                        sx={{
                          opacity: 0.5,
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        <FaEllipsisV size={14} />
                      </IconButton>
                    )}
                    {isForward && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectForwardRoom(room, isSelected);
                        }}
                        sx={{
                          opacity: 0.5,
                          transition: "opacity 0.2s ease",
                        }}
                      >
                        {isSelected ? (
                          <FaCheck size={14} />
                        ) : (
                          <FaPlus size={14} />
                        )}
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemButton
                  onClick={() =>
                    isForward
                      ? onSelectForwardRoom(room, isSelected)
                      : onSelectRoom(room)
                  }
                  // component={Link}
                  // href={`?roomId=${room.id}`}
                  sx={{
                    borderRadius: 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={unReadCount}
                      color="error"
                      overlap="circular"
                      sx={{
                        position: "relative",
                        "& .MuiBadge-badge": {
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        },
                      }}
                    >
                      <OnlineStatus lastSeenAt={room.lastSeenAt} />
                      <Avatar
                        src={getRoomAvatar(room)}
                        alt={roomLabel}
                        sx={{
                          border:
                            selectedRoomId === room.id ? "2px solid" : "none",
                          borderColor: "primary.main",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {roomLabel.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" gap={0.5} alignItems="center">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight:
                              selectedRoomId === room.id || unReadCount > 0
                                ? 700
                                : 500,
                            color: unReadCount > 0 ? "error.main" : "inherit",
                          }}
                        >
                          {roomLabel}
                        </Typography>
                        {isMuted && (
                          <FaBellSlash size={12} style={{ opacity: 0.5 }} />
                        )}
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.4} sx={{ pr: 1 }}>
                        <Typography
                          variant="caption"
                          color="textPrimary"
                          noWrap
                          sx={{ display: "block", maxWidth: "100%" }}
                        >
                          {getLastMessageText(room)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          <LastSeenAt lastSeenAt={room.lastSeenAt} />
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
                <RoomActions
                  menuAnchor={menuAnchor}
                  menuRoomId={menuRoomId}
                  room={room}
                  handleMenuClose={handleMenuClose}
                  onMuteRoom={onMuteRoom}
                  onArchiveRoom={onArchiveRoom}
                  setDeleteConfirm={setDeleteConfirm}
                  setLeaveConfirm={setLeaveConfirm}
                  isMuted={isMuted}
                  isArchived={isArchived}
                />
              </ListItem>
            );
          })
        )}
        <div ref={roomsEndRef} />
        <LoadMoreButton
          disabled={cantLoadMore}
          onClick={loadMoreRooms}
          loadingMore={loadingMore}
        />
      </List>

      {/* Menu */}

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteRoom}
      />
      {!isTab && (
        <LeaveConfirmDialog
          open={leaveConfirm}
          onClose={() => setLeaveConfirm(false)}
          onConfirm={handleLeaveRoom}
        />
      )}
    </Box>
  );
}
function DeleteConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1304,
      }}
    >
      <DialogTitle>Delete Chat?</DialogTitle>
      <DialogContent>
        <Typography>
          This action cannot be undone. All messages will be deleted.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
function LeaveConfirmDialog({ open, onClose, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        zIndex: 1304,
      }}
    >
      <DialogTitle>Leave Chat?</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to leave this chat? You will no longer receive
          messages from this room.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          Leave
        </Button>
      </DialogActions>
    </Dialog>
  );
}
