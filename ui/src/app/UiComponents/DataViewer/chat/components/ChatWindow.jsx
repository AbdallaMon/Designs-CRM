"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from "@mui/material";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaPhone,
  FaVideo,
  FaInfo,
  FaPlus,
  FaUsers,
} from "react-icons/fa";
import { CHAT_ROOM_TYPE_LABELS, CHAT_ROOM_TYPES } from "../utils/chatConstants";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useChatMessages } from "../hooks/useChatMessages";
import { useSocketIO } from "../hooks/useSocketIO";
import { markMessagesRead, markMessageAsRead } from "../utils/socketIO";
import dayjs from "dayjs";

export function ChatWindow({
  room,
  onClose,
  projectId = null,
  clientLeadId = null,
  isMobile = false,
  onRoomActivity = () => {},
}) {
  const { user } = useAuth();
  const { setLoading: setToastLoading } = useToastContext();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [members, setMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    deleteMessage,
    messagesEndRef,
    setMessages,
  } = useChatMessages(room?.id);
  // Real-time updates with Socket.IO
  const {
    isConnected,
    typingUsers: socketTypingUsers,
    onlineUsers: socketOnlineUsers,
    emitTyping,
  } = useSocketIO(room?.id, {
    enabled: !!room?.id,
    onNewMessage: (data) => {
      // Message added via API call will update through useChatMessages
      // This is for receiving messages from other users
      console.log("New message from socket:", data);
      setMessages((prev) => [...prev, data]);

      // Mark as read immediately when receiving new message
      onRoomActivity?.(data);
      if (room?.id) {
        markMessageAsRead(room.id, data.id, user.id);
      }
    },
    onMessageEdited: (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.id ? { ...msg, isEdited: true } : msg
        )
      );
    },
    onMessageDeleted: (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.id ? { ...msg, isDeleted: true } : msg
        )
      );
    },
    onTyping: (data) => {
      if (data.userId !== user.id) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    },
    onStopTyping: (data) => {
      console.log(data, "data");

      setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
    },
    onMemberJoined: (data) => {
      console.log("Member joined:", data);
      setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
    },
    onMemberLeft: (data) => {
      console.log("Member left:", data);
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    },
  });
  const isAdmin =
    user.role === "ADMIN" ||
    user.role === "SUPER_ADMIN" ||
    room?.createdBy?.id === user.id;

  const isMember = room?.members?.some((m) => m.userId === user.id);
  const canManageMembers =
    isAdmin && room?.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF;

  useEffect(() => {
    if (room?.id) {
      setMembers(room.members || []);
      // Mark all messages in room as read when room opens
      markMessagesRead(room.id, user.id);
    }
  }, [room]);

  const handleSendMessage = async (content, fileData) => {
    const messageData = {
      content,
      replyToId: replyingTo?.id,
      type: fileData ? "FILE" : "TEXT",
      fileUrl: fileData?.fileUrl ? fileData?.fileUrl : null,
      fileName: fileData?.name,
      fileSize: fileData?.file?.size,
      fileMimeType: fileData?.type,
    };

    const result = await sendMessage(messageData);
    if (result) {
      setReplyingTo(null);
      onRoomActivity?.(result);
    }
  };

  const handleAddMembers = async () => {
    const memberIds = selectedUsers.map((u) => u.id);
    const response = await handleRequestSubmit(
      { userIds: memberIds },
      setToastLoading,
      `shared/chat/rooms/${room.id}/members`,
      false,
      "Adding members",
      false,
      "POST"
    );

    if (response?.status === 200) {
      setMembers(response.data.members || []);
      setShowAddMembers(false);
      setSelectedUsers([]);
    }
  };

  const loadAvailableUsers = async () => {
    if (!canManageMembers) return;
    setLoadingUsers(true);
    try {
      let url = `admin/all-users?`;
      if (projectId) {
        url += `projectId=${projectId}&`;
      }
      const response = await getData({
        url,
        setLoading: () => {},
      });

      if (response?.status === 200) {
        const alreadyMembers = members
          .filter((m) => m.userId)
          .map((m) => m.userId);
        setAvailableUsers(
          response.data.filter((u) => !alreadyMembers.includes(u.id))
        );
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAddMembers && canManageMembers) {
      loadAvailableUsers();
    }
  }, [showAddMembers, canManageMembers]);

  // Scroll to bottom whenever messages change (instant with scrollIntoView)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  if (!room) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "textSecondary",
        }}
      >
        <Typography>Select a chat to start messaging</Typography>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "80vh",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isMobile && onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                mr: 1,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FaArrowLeft size={18} />
            </IconButton>
          )}
          <Avatar
            sx={{
              width: 40,
              height: 40,
              border: "2px solid",
              borderColor: "background.paper",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {room.name?.charAt(0) || "C"}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {room.name || "Chat"}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {CHAT_ROOM_TYPE_LABELS[room.type] || room.type}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title="Voice call" arrow>
            <IconButton
              size="small"
              sx={{
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FaPhone size={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video call" arrow>
            <IconButton
              size="small"
              sx={{
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "action.hover",
                  transform: "scale(1.1)",
                },
              }}
            >
              <FaVideo size={18} />
            </IconButton>
          </Tooltip>
          {canManageMembers && (
            <Tooltip title="Members" arrow>
              <IconButton
                size="small"
                onClick={() => canManageMembers && setShowAddMembers(true)}
                sx={{
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    transform: "scale(1.1)",
                  },
                }}
              >
                <FaUsers size={18} />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            size="small"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "action.hover",
                transform: "scale(1.1)",
              },
            }}
          >
            <FaEllipsisV size={18} />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            {canManageMembers && (
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null);
                  setShowAddMembers(true);
                }}
              >
                <FaPlus size={14} style={{ marginRight: 8 }} />
                Add Members
              </MenuItem>
            )}
            {isAdmin && (
              <MenuItem>
                <FaInfo size={14} style={{ marginRight: 8 }} />
                Room Settings
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          scrollBehavior: "smooth",
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.2)",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.3)",
            },
          },
        }}
      >
        {messagesLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flex: 1,
              color: "textSecondary",
            }}
          >
            <Typography>No messages yet. Start the conversation!</Typography>
          </Box>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                currentUserId={user.id}
                isCurrentUserAdmin={isAdmin}
                onReply={setReplyingTo}
                onEdit={(msgId) => {
                  if (msgId) {
                    setEditingMessageId(msgId);
                  } else {
                    setEditingMessageId(null);
                  }
                }}
                onDelete={deleteMessage}
                isEditing={editingMessageId === msg.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              animation: "fadeIn 0.3s ease-in",
              "@keyframes fadeIn": {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontStyle: "italic", color: "textSecondary" }}
            >
              {typingUsers.length === 1
                ? `${
                    members.find((m) => m.userId === typingUsers[0])?.message ||
                    "Someone"
                  } is typing`
                : `${typingUsers.length} people are typing`}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "primary.main",
                    animation: "bounce 1.4s infinite",
                    animationDelay: `${i * 0.2}s`,
                    "@keyframes bounce": {
                      "0%, 80%, 100%": { opacity: 0.5 },
                      "40%": { opacity: 1 },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Input area */}
      <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <ChatInput
          onSendMessage={handleSendMessage}
          onReplyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          loading={messagesLoading}
          disabled={!isMember && !isAdmin}
          onTyping={emitTyping}
          socketConnected={isConnected}
        />
      </Box>

      {/* Add members dialog */}
      <Dialog
        open={showAddMembers && canManageMembers}
        onClose={() => setShowAddMembers(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Members to Chat</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {/* Existing members */}
            {members.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Current Members
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {members.map((m) => (
                    <Chip
                      key={m.id}
                      avatar={<Avatar src={m.user?.avatar} />}
                      label={m.user?.name || m.client?.name || "Unknown"}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* New members select */}
            {loadingUsers ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel>Select Members to Add</InputLabel>
                <Select
                  multiple
                  value={selectedUsers}
                  onChange={(e) => setSelectedUsers(e.target.value)}
                  label="Select Members to Add"
                  disabled={loadingUsers || availableUsers.length === 0}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((user) => (
                        <Chip key={user.id} label={user.name} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableUsers.length === 0 ? (
                    <MenuItem disabled>No new members available</MenuItem>
                  ) : (
                    availableUsers.map((u) => (
                      <MenuItem key={u.id} value={u}>
                        {u.name} ({u.email})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddMembers(false)}>Cancel</Button>
          <Button
            onClick={handleAddMembers}
            variant="contained"
            disabled={selectedUsers.length === 0 || loadingUsers}
          >
            Add Members
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
