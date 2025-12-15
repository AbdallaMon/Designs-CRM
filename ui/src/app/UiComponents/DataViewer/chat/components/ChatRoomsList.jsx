"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/material";
import {
  FaSearch,
  FaEllipsisV,
  FaBell,
  FaBellSlash,
  FaArchive,
  FaTrash,
  FaPlus,
} from "react-icons/fa";
import { CHAT_ROOM_TYPE_LABELS, CHAT_ROOM_TYPES } from "../utils/chatConstants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function ChatRoomsList({
  rooms,
  selectedRoomId,
  onSelectRoom,
  onMuteRoom,
  onArchiveRoom,
  onDeleteRoom,
  onCreateNewRoom,
  loading = false,
  initialLoading = false,
  onLoadMore,
  hasMore = false,
  isWidget = false,
  typingRooms = {},
  onSearch,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRoomId, setMenuRoomId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const DEBOUNCE_MS = 450;
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

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (!onLoadMore || !hasMore || loading) return;
    if (scrollTop + clientHeight >= scrollHeight - 120) {
      onLoadMore();
    }
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
    // Prefer backend-provided unread count if available
    if (typeof room.unreadCount === "number") return room.unreadCount;
    // Fallback: derive from members read state
    return room.members?.filter((m) => !m.lastReadAt)?.length || 0;
  };

  const getRoomAvatar = (room) => {
    if (room.avatarUrl) return room.avatarUrl;
    if (room.members?.length === 2) {
      const otherMember = room.members[0];
      return otherMember.user?.avatar || otherMember.client?.avatar;
    }
    return room.name?.charAt(0);
  };

  const getRoomLabel = (room) => {
    if (room.type === "STAFF_TO_STAFF") {
      const otherMember = room.otherMembers?.[0];
      if (otherMember?.user) {
        return otherMember.user.name;
      }
    }
    if (room.name) return room.name;
    if (room.type === "CLIENT_TO_STAFF") {
      const member = room.members?.find((m) => m.user);
      return member?.user?.name || "Client";
    }
    return CHAT_ROOM_TYPE_LABELS[room.type] || room.type || "Chat";
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
      {!isWidget && (
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton color="primary" onClick={onCreateNewRoom} size="small">
              <FaPlus />
            </IconButton>
          </Box>
        </Box>
      )}

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

      {/* Rooms list */}
      <List
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflow: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "3px",
          },
        }}
      >
        {rooms?.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
            <Typography color="textSecondary">No chats found</Typography>
          </Box>
        ) : (
          rooms?.map((room) => (
            <ListItem
              key={room.id}
              disablePadding
              sx={{
                bgcolor:
                  selectedRoomId === room.id
                    ? "action.selected"
                    : getUnreadCount(room) > 0
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
                    : getUnreadCount(room) > 0
                    ? "3px solid error.main"
                    : "3px solid transparent",
                borderLeftColor: "primary.main",
              }}
              secondaryAction={
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
              }
            >
              <ListItemButton
                onClick={() => onSelectRoom(room)}
                sx={{
                  borderRadius: 1,
                  transition: "all 0.2s ease",
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={getUnreadCount(room)}
                    color="error"
                    overlap="circular"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      },
                    }}
                  >
                    <Avatar
                      src={getRoomAvatar(room)}
                      alt={getRoomLabel(room)}
                      sx={{
                        border:
                          selectedRoomId === room.id ? "2px solid" : "none",
                        borderColor: "primary.main",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {getRoomLabel(room).charAt(0)}
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
                            selectedRoomId === room.id ||
                            getUnreadCount(room) > 0
                              ? 700
                              : 500,
                          color:
                            getUnreadCount(room) > 0 ? "error.main" : "inherit",
                        }}
                      >
                        {getRoomLabel(room)}
                      </Typography>
                      {room.isMuted && (
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
                        {dayjs(room.updatedAt).fromNow()}
                      </Typography>
                    </Stack>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            onMuteRoom(menuRoomId);
            handleMenuClose();
          }}
        >
          {rooms.find((r) => r.id === menuRoomId)?.isMuted ? (
            <>
              <FaBell size={14} style={{ marginRight: 8 }} />
              Unmute
            </>
          ) : (
            <>
              <FaBellSlash size={14} style={{ marginRight: 8 }} />
              Mute
            </>
          )}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onArchiveRoom(menuRoomId);
            handleMenuClose();
          }}
        >
          <FaArchive size={14} style={{ marginRight: 8 }} />
          Archive
        </MenuItem>
        {rooms.find((r) => r.id === menuRoomId)?.type !==
          CHAT_ROOM_TYPES.STAFF_TO_STAFF && (
          <MenuItem
            onClick={() => {
              setDeleteConfirm(true);
            }}
          >
            <FaTrash size={14} style={{ marginRight: 8 }} />
            Delete
          </MenuItem>
        )}
      </Menu>

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete Chat?</DialogTitle>
        <DialogContent>
          <Typography>
            This action cannot be undone. All messages will be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDeleteRoom} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
