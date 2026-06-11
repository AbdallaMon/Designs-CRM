"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  IconButton,
  TextField,
  InputAdornment,
  Stack,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Tooltip,
} from "@mui/material";
import { FaSearch, FaEllipsisV, FaBellSlash, FaPlus, FaExternalLinkAlt, FaCheck } from "react-icons/fa";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ChatChips } from "./ChatChips.jsx";
import { LastSeenAt, OnlineStatus } from "../members/LastSeenAt.jsx";
import { ScrollButton } from "../messages/ScrollButton.jsx";
import { RoomActions } from "./RoomActions.jsx";
import { LoadMoreButton } from "../indicators/LoadMoreButton.jsx";
import { getRoomAvatar, getRoomLabel } from "../../chat.utils.js";
import { useAuth } from "@/app/v2/providers/AuthProvider";

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
  isForward = false,
  selectedForwardRooms = [],
  onSelectForwardRoom,
  canCreate = true,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRoomId, setMenuRoomId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const DEBOUNCE_MS = 450;
  const cantLoadMore = !hasMore || loading || loadingMore || initialLoading;
  const { user } = useAuth();

  const debouncedSearch = useMemo(() => {
    let t;
    const fn = (v) => {
      clearTimeout(t);
      t = setTimeout(() => onSearch?.(v), DEBOUNCE_MS);
    };
    fn.cancel = () => clearTimeout(t);
    fn.flush = (v) => {
      clearTimeout(t);
      onSearch?.(v);
    };
    return fn;
  }, [onSearch]);

  useEffect(() => () => debouncedSearch.cancel?.(), [debouncedSearch]);

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
    if (typingRooms[room.id]) {
      const count = typingRooms[room.id] instanceof Set ? typingRooms[room.id].size : typingRooms[room.id];
      if (count > 0) {
        return (
          <Typography variant="caption" sx={{ fontStyle: "italic", color: "primary.main", fontWeight: 500 }}>
            {count} {count === 1 ? "شخص يكتب" : "أشخاص يكتبون"}...
          </Typography>
        );
      }
    }
    const last = room.lastMessage;
    if (!last) return "لا توجد رسائل بعد";
    if (last.type === "FILE") return last.fileName || "ملف";
    const text = last.content || "";
    return text.length > 60 ? `${text.slice(0, 60)}…` : text;
  };

  const getUnreadCount = (room) => unreadCounts?.[room.id] || 0;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {!isForward && !isWidget && canCreate && (
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "flex-end" }}>
          <Button color="primary" onClick={onCreateNewRoom} size="small" variant="outlined" startIcon={<FaPlus />}>
            {isTab ? "محادثة جماعية" : "مجموعة"}
          </Button>
        </Box>
      )}
      <Box sx={{ p: 2, pt: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="ابحث في المحادثات..."
          value={searchQuery}
          onChange={(e) => {
            const v = e.target.value;
            setSearchQuery(v);
            debouncedSearch(v.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") debouncedSearch.flush?.(searchQuery.trim());
          }}
          variant="outlined"
          sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <FaSearch size={14} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      {!isForward && (
        <Box>
          <ChatChips onSelect={onSelectChatType} isTab={isTab} />
        </Box>
      )}

      <List ref={scrollContainerRef} sx={{ flex: 1, overflow: "auto", position: "relative" }}>
        <ScrollButton containerRef={scrollContainerRef} direction="up" threshold={300} position={{ top: 8, right: 8 }} />
        {rooms?.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 3 }}>
            <Typography color="textSecondary">لا توجد محادثات</Typography>
          </Box>
        ) : (
          rooms?.map((room) => {
            const member = room?.members?.find((m) => m.userId === user.id);
            const isMuted = member?.isMuted;
            const isArchived = member?.isArchived;
            const unReadCount = getUnreadCount(room);
            const roomLabel = getRoomLabel(room);
            const isSelected = selectedForwardRooms?.find((r) => r.id === room.id);
            return (
              <ListItem
                key={room.id}
                disablePadding
                sx={{
                  bgcolor: isSelected || selectedRoomId === room.id
                    ? "action.selected"
                    : unReadCount > 0
                      ? "primary.lighter"
                      : "transparent",
                  "&:hover": { bgcolor: "action.hover", "& .MuiIconButton-root": { opacity: 1 } },
                  borderInlineStart: selectedRoomId === room.id ? "3px solid" : "3px solid transparent",
                  borderInlineStartColor: "primary.main",
                }}
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    {!isForward && (
                      <Tooltip title="فتح في نافذة جديدة">
                        <IconButton
                          edge="start"
                          size="small"
                          sx={{ opacity: 0.5 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = new URL(window.location.origin + window.location.pathname);
                            url.searchParams.set("roomId", room.id);
                            window.open(url.toString(), "_blank");
                          }}
                        >
                          <FaExternalLinkAlt size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {!isForward && (
                      <IconButton edge="end" size="small" onClick={(e) => handleMenuOpen(e, room.id)} sx={{ opacity: 0.5 }}>
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
                        sx={{ opacity: 0.5 }}
                      >
                        {isSelected ? <FaCheck size={14} /> : <FaPlus size={14} />}
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemButton
                  onClick={() => (isForward ? onSelectForwardRoom(room, isSelected) : onSelectRoom(room))}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemAvatar>
                    <Badge badgeContent={unReadCount} color="error" overlap="circular" sx={{ position: "relative" }}>
                      <OnlineStatus lastSeenAt={room.lastSeenAt} />
                      <Avatar
                        src={getRoomAvatar(room)}
                        alt={roomLabel}
                        sx={{ border: selectedRoomId === room.id ? "2px solid" : "none", borderColor: "primary.main" }}
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
                            fontWeight: selectedRoomId === room.id || unReadCount > 0 ? 700 : 500,
                            color: unReadCount > 0 ? "error.main" : "inherit",
                          }}
                        >
                          {roomLabel}
                        </Typography>
                        {isMuted && <FaBellSlash size={12} style={{ opacity: 0.5 }} />}
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={0.4} sx={{ pr: 1 }}>
                        <Typography variant="caption" color="textPrimary" noWrap sx={{ display: "block", maxWidth: "100%" }}>
                          {getLastMessageText(room)}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          <LastSeenAt lastSeenAt={room.lastSeenAt} />
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItemButton>
                {!isForward && (
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
                    canDelete={Boolean(room?.capabilities?.canDelete)}
                  />
                )}
              </ListItem>
            );
          })
        )}
        <div ref={roomsEndRef} />
        <LoadMoreButton disabled={cantLoadMore} onClick={loadMoreRooms} loadingMore={loadingMore} />
      </List>

      <ConfirmRoomDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDeleteRoom}
        title="حذف المحادثة؟"
        description="لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع الرسائل."
        confirmLabel="حذف"
      />
      <ConfirmRoomDialog
        open={leaveConfirm}
        onClose={() => setLeaveConfirm(false)}
        onConfirm={handleLeaveRoom}
        title="مغادرة المحادثة؟"
        description="لن تتلقى رسائل من هذه المحادثة بعد المغادرة."
        confirmLabel="مغادرة"
      />
    </Box>
  );
}

function ConfirmRoomDialog({ open, onClose, onConfirm, title, description, confirmLabel }) {
  return (
    <Dialog open={open} onClose={onClose} sx={{ zIndex: 1304 }}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
