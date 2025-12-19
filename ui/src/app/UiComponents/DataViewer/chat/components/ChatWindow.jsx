"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  Tabs,
  Tab,
} from "@mui/material";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaPhone,
  FaVideo,
  FaInfo,
  FaPlus,
  FaUsers,
  FaComments,
  FaFolder,
  FaTimes,
} from "react-icons/fa";
import { CHAT_ROOM_TYPE_LABELS, CHAT_ROOM_TYPES } from "../utils/chatConstants";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatFilesTab } from "./ChatFilesTab";
import { useChatMessages, useSocket } from "../hooks";
import { processMessagesWithDayGroups } from "../utils/dayGrouping";

import {
  markMessagesRead,
  markMessageAsRead,
  joinChatRoom,
  typing,
  emitStopTyping,
} from "../utils/socketIO";
import DeleteModelButton from "@/app/UiComponents/common/DeleteModelButton";

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
  const [members, setMembers] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentTab, setCurrentTab] = useState(0); // 0: Chat, 1: Files
  const typingTimeoutRef = useRef(null);

  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    deleteMessage,
    messagesEndRef,
    setMessages,
    messagesStartRef,
    scrollToBottom,
    loadingMore,
    initialLoading,
    scrollContainerRef,
    hasMore,
  } = useChatMessages(room?.id);
  const processedMessages = useMemo(() => {
    return processMessagesWithDayGroups(messages);
  }, [messages]);

  // Join room when it changes
  useEffect(() => {
    if (room?.id && user) {
      joinChatRoom(room.id, user);
    }
  }, [room?.id, user]);
  const emitTyping = useCallback(() => {
    typing({ roomId: room?.id, user });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [room?.id, user]);

  // Function to emit stop typing
  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    emitStopTyping({ roomId: room?.id, user });
  }, [room?.id, user]);
  // Listen to socket events
  useSocket({
    onMessageCreated: (data) => {
      // Only add if it's for this room and not from self
      if (data.roomId === room?.id && data.senderId !== user.id) {
        setMessages((prev) => [...prev, data]);
        onRoomActivity?.(data);
        markMessageAsRead(room.id, data.id, user.id);
      }
    },
    onMessageEdited: (data) => {
      if (data.roomId === room?.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, isEdited: true, ...data } : msg
          )
        );
      }
    },
    onMessageDeleted: (data) => {
      if (data.roomId === room?.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, isDeleted: true } : msg
          )
        );
      }
    },
    onTyping: (data) => {
      if (data.roomId === room?.id && data.userId !== user.id) {
        const key = `${data.userId}:${data.roomId}`;

        setTypingUsers((prev) => {
          const map = new Map(prev.map((u) => [`${u.userId}:${u.roomId}`, u]));
          map.set(key, data); // overwrite/update same user+room
          return Array.from(map.values());
        });
      }
    },
    onStopTyping: (data) => {
      if (data.roomId === room?.id) {
        setTypingUsers((prev) =>
          prev.filter((items) => items.userId !== data.userId)
        );
      }
    },
    onMemberJoined: (data) => {
      if (data.roomId === room?.id) {
        setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    },
    onMemberLeft: (data) => {
      if (data.roomId === room?.id) {
        setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
      }
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
    if (messagesEndRef.current && initialLoading) {
      scrollToBottom();
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

  const getAvatarSrc = useCallback((entity) => {
    return (
      entity?.profilePicture ||
      entity?.avatar ||
      entity?.user?.profilePicture ||
      entity?.user?.avatar ||
      null
    );
  }, []);

  const toggleSelectUser = useCallback((userToToggle) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === userToToggle.id);
      if (exists) {
        return prev.filter((u) => u.id !== userToToggle.id);
      }
      return [...prev, userToToggle];
    });
  }, []);

  const availableUsersSorted = useMemo(
    () =>
      [...availableUsers].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      ),
    [availableUsers]
  );

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "calc(100vh - 120px)",
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
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
          {((isMobile && onClose) || currentTab === 1) && (
            <IconButton
              size="small"
              onClick={
                currentTab === 1
                  ? () => {
                      setCurrentTab(0);
                    }
                  : onClose
              }
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
          <Box
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
            onClick={() => setCurrentTab(1)}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                border: "2px solid",
                borderColor: "background.paper",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
            >
              {room.name?.charAt(0) || "C"}
            </Avatar>
            <Box sx={{ cursor: "pointer" }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {room.name || "Chat"}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {CHAT_ROOM_TYPE_LABELS[room.type] || room.type}
              </Typography>
            </Box>
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
        </Box>
      </Box>

      {/* Tab Content */}

      <>
        {/* Messages area */}
        <Box
          ref={scrollContainerRef}
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
          ) : processedMessages.length === 0 ? (
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
              <div ref={messagesStartRef} />
              {!hasMore && (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    textAlign: "center",
                    color: "textSecondary",
                    mb: 1,
                  }}
                >
                  No more messages
                </Typography>
              )}
              {loadingMore && <CircularProgress />}

              {processedMessages.map((msg) => (
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
                  ? `${typingUsers[0]?.message || "Someone"} is typing`
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
          />
        </Box>
      </>

      <Dialog
        open={currentTab === 1}
        onClose={() => setCurrentTab(0)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography>Chat Files</Typography>
            <IconButton onClick={() => setCurrentTab(0)}>
              <FaTimes />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <ChatFilesTab roomId={room?.id} />
        </DialogContent>
      </Dialog>

      {/* Add members dialog */}
      <Dialog
        open={showAddMembers && canManageMembers}
        onClose={() => setShowAddMembers(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add Members to Chat</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {/* Existing members with avatars */}
            {members.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Current Members
                </Typography>
                <Stack spacing={1.5}>
                  {members.map((m) => (
                    <Stack
                      key={m.id}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                    >
                      <Avatar src={getAvatarSrc(m.user)}>
                        {(m.user?.name || m.client?.name || "?").charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600} noWrap>
                          {m.user?.name || m.client?.name || "Unknown"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {m.user?.email || m.client?.email || ""}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {/* New members list with selectable rows */}
            {loadingUsers ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : availableUsersSorted.length === 0 ? (
              <Box sx={{ p: 2 }}>
                <Typography color="textSecondary">
                  No new members available
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}>
                <Stack spacing={1}>
                  {availableUsersSorted.map((u) => {
                    const isSelected = selectedUsers.some((s) => s.id === u.id);
                    return (
                      <Paper
                        key={u.id}
                        variant="outlined"
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          cursor: "pointer",
                          borderColor: isSelected ? "primary.main" : "divider",
                          bgcolor: isSelected
                            ? "primary.lighter"
                            : "background.paper",
                        }}
                        onClick={() => toggleSelectUser(u)}
                      >
                        <Avatar src={getAvatarSrc(u)}>
                          {(u.name || "?").charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={600} noWrap>
                            {u.name || "Unknown"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                          >
                            {u.email || ""}
                          </Typography>
                        </Box>
                        <Chip
                          label={isSelected ? "Selected" : "Select"}
                          color={isSelected ? "primary" : "default"}
                          size="small"
                          variant={isSelected ? "filled" : "outlined"}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Selected summary */}
            {selectedUsers.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Selected to add ({selectedUsers.length})
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {selectedUsers.map((u) => (
                    <Chip
                      key={u.id}
                      avatar={
                        <Avatar src={getAvatarSrc(u)}>
                          {(u.name || "?").charAt(0)}
                        </Avatar>
                      }
                      label={u.name}
                      onDelete={() => toggleSelectUser(u)}
                    />
                  ))}
                </Stack>
              </Box>
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
