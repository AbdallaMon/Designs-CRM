"use client";

import React, { useState } from "react";
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
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRoomId, setMenuRoomId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.members?.some((m) =>
        (m.user?.name || m.client?.name)
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      );

    return matchesSearch;
  });

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
    if (room.name) return room.name;
    if (room.type === "CLIENT_TO_STAFF") {
      const member = room.members?.find((m) => m.user);
      return member?.user?.name || "Client";
    }
    return CHAT_ROOM_TYPE_LABELS[room.type] || room.type || "Chat";
  };
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
          onChange={(e) => setSearchQuery(e.target.value)}
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
        {filteredRooms.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
            <Typography color="textSecondary">No chats found</Typography>
          </Box>
        ) : (
          filteredRooms.map((room) => (
            <ListItem
              key={room.id}
              disablePadding
              sx={{
                bgcolor:
                  selectedRoomId === room.id
                    ? "action.selected"
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
                          fontWeight: selectedRoomId === room.id ? 600 : 500,
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
                      <Chip
                        label={CHAT_ROOM_TYPE_LABELS[room.type] || room.type}
                        size="small"
                        sx={{
                          fontSize: 10,
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor:
                            room.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF
                              ? "primary.light"
                              : room.type === CHAT_ROOM_TYPES.PROJECT_GROUP
                              ? "secondary.light"
                              : "info.light",
                          color:
                            room.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF
                              ? "primary.dark"
                              : room.type === CHAT_ROOM_TYPES.PROJECT_GROUP
                              ? "secondary.dark"
                              : "info.dark",
                        }}
                        variant="filled"
                      />
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

      {loading && hasMore && (
        <Box sx={{ py: 1, display: "flex", justifyContent: "center" }}>
          <CircularProgress size={18} />
        </Box>
      )}

      {initialLoading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          {/* <CircularProgress size={28} /> */}
        </Box>
      )}
    </Box>
  );
}
