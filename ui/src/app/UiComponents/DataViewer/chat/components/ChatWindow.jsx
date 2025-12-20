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
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
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
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { MdDelete } from "react-icons/md";
import { useChatMembers } from "../hooks/useChatMembers";
import { LastSeenAt, OnlineStatus } from "./LastSeenAt";

export function ChatWindow({
  room,
  onClose,
  projectId = null,
  clientLeadId = null,
  isMobile = false,
  onRoomActivity = () => {},
  reFetchRooms = () => {},
}) {
  const { user } = useAuth();
  const { setLoading: setToastLoading } = useToastContext();
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newMembersAdded, setNewMembersAdded] = useState([]);
  const [newMemberAlertOpen, setNewMemberAlertOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0); // 0: Chat, 1: Files
  const typingTimeoutRef = useRef(null);
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
  const roomLabel = getRoomLabel(room);
  // ✅ Confirm delete dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Confirm");
  const [confirmDescription, setConfirmDescription] = useState("");
  const confirmActionRef = useRef(null);

  const openConfirm = useCallback((title, description, onConfirm) => {
    setConfirmTitle(title || "Confirm");
    setConfirmDescription(description || "");
    confirmActionRef.current = onConfirm;
    setConfirmOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    confirmActionRef.current = null;
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      const fn = confirmActionRef.current;
      closeConfirm();
      if (typeof fn === "function") {
        await fn();
      }
    } catch (e) {
      console.error("Confirm action failed:", e);
    }
  }, [closeConfirm]);

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
    onJumpToMessage,
    loadingJumpToMessage,
    setReplyLoaded,
    replyLoaded,
    replayLoadingMessageId,
    setReplayLoadingMessageId,
    loading,
    newMessagesCount,
    setNewMessagesCount,
  } = useChatMessages(room?.id);

  const {
    members,
    loading: membersLoading,
    fetchMembers,
    setMembers,
  } = useChatMembers(room?.id);

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

  useEffect(() => {
    //remove after 10 seconds
    if (newMemberAlertOpen) {
      const timer = setTimeout(() => {
        setNewMemberAlertOpen(false);
        setNewMembersAdded([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [newMemberAlertOpen]);

  // Listen to socket events
  useSocket({
    onMessageCreated: (data) => {
      // Only add if it's for this room and not from self
      if (data.roomId === room?.id) {
        setMessages((prev) => [...prev, data]);
        onRoomActivity?.(data);
        markMessageAsRead(room.id, data.id, user.id);

        setNewMessagesCount((prev) => prev + 1);
        window.setTimeout(() => {
          scrollToBottom();
        }, 100);
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
            msg.id === data.messageId ? { ...msg, isDeleted: true } : msg
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
    onMembersAdded: (data) => {
      if (data.roomId === room?.id) {
        setNewMembersAdded(data.newMembers);
        setNewMemberAlertOpen(true);
      }
    },
  });

  const isAdmin = checkIfAdmin(user) || room?.createdBy?.id === user.id;

  const isMember = members?.some((m) => m.userId === user.id);

  const isNotDirectChat = room?.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF;
  const canManageMembers = isAdmin && isNotDirectChat;

  useEffect(() => {
    if (room?.id) {
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
      fetchMembers();
      setSelectedUsers([]);
    }
  };

  const handleRemoveMember = async (memberId) => {
    const response = await handleRequestSubmit(
      { memberId: memberId },
      setToastLoading,
      `shared/chat/rooms/${room.id}/members/${memberId}`,
      false,
      "Removing member",
      false,
      "DELETE"
    );
    if (response?.status === 200) {
      fetchMembers();
    }
  };

  const confirmRemoveMember = useCallback(
    (member) => {
      const name = member?.user?.name || member?.client?.name || "this member";
      openConfirm(
        "Remove member?",
        `Are you sure you want to remove ${name} from this chat?`,
        async () => {
          await handleRemoveMember(member.id);
        }
      );
    },
    [openConfirm]
  );

  // ✅ Confirm delete message wrapper (works whether ChatMessage sends id or message object)
  const confirmDeleteMessage = useCallback(
    (payload) => {
      const msgId =
        typeof payload === "object" && payload?.id ? payload.id : payload;
      if (!msgId) return;

      openConfirm(
        "Delete message?",
        "This will delete the message for everyone in the chat.",
        async () => {
          await deleteMessage(msgId);
        }
      );
    },
    [openConfirm, deleteMessage]
  );

  const loadAvailableUsers = async (wait) => {
    if (!isNotDirectChat) return;
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
    if (showAddMembers && isNotDirectChat) {
      loadAvailableUsers();
    }
  }, [showAddMembers, isNotDirectChat, members]);

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
                {roomLabel}
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
          {isNotDirectChat && (
            <Tooltip title="Members" arrow>
              <IconButton
                size="small"
                onClick={() => setShowAddMembers(true)}
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
                  // ✅ confirm before delete
                  onDelete={confirmDeleteMessage}
                  isEditing={editingMessageId === msg.id}
                  loadingReplayJump={loadingJumpToMessage}
                  onJumpToMessage={onJumpToMessage}
                  replyLoaded={replyLoaded}
                  setReplyLoaded={setReplyLoaded}
                  replayLoadingMessageId={replayLoadingMessageId}
                  setReplayLoadingMessageId={setReplayLoadingMessageId}
                />
              ))}

              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                }}
                ref={messagesEndRef}
              />
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
          {newMemberAlertOpen && newMembersAdded.length > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 1,
                bgcolor: "info.lighter",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "info.main",
              }}
            >
              <Typography variant="caption" sx={{ color: "info.main" }}>
                {newMembersAdded
                  .map((m) => m.name || m.user?.name || "A member")
                  .join(", ")}{" "}
                {newMembersAdded.length === 1 ? "has" : "have"} has been added
                to the chat.
              </Typography>
              <IconButton
                size="small"
                onClick={() => setNewMemberAlertOpen(false)}
                sx={{ ml: 1 }}
              >
                <FaTimes size={12} />
              </IconButton>
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
            disabled={
              (!isMember && !isAdmin) || (!isAdmin && !room.isChatEnabled)
            }
            onTyping={emitTyping}
          />
        </Box>
      </>

      <Dialog
        open={currentTab === 1}
        onClose={() => setCurrentTab(0)}
        fullWidth
        maxWidth="md"
        sx={{
          "& .MuiPaper-root": {
            margin: "10px !important",
            width: "calc(100% - 20px)",
          },
        }}
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
        <DialogContent
          dividers
          sx={{
            padding: "12px !important",
          }}
        >
          <ChatFilesTab roomId={room?.id} />
        </DialogContent>
      </Dialog>

      {/* Add members dialog */}
      <Dialog
        open={showAddMembers}
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
                      sx={{
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                        }}
                      >
                        <OnlineStatus
                          lastSeenAt={
                            m.user?.lastSeenAt || m.client?.lastSeenAt
                          }
                        />
                        <Avatar
                          src={getAvatarSrc(m.user)}
                          sx={{
                            position: "relative",
                          }}
                        >
                          {(m.user?.name || m.client?.name || "?").charAt(0)}
                        </Avatar>
                      </Box>
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
                        <LastSeenAt
                          lastSeenAt={
                            m.user?.lastSeenAt || m.client?.lastSeenAt
                          }
                        />
                      </Box>
                      <Box>
                        <Chip
                          label={
                            m.role === "ADMIN"
                              ? "Admin"
                              : m.role === "MODERATOR"
                              ? "Moderator"
                              : "Member"
                          }
                          color={
                            m.role === "ADMIN"
                              ? "primary"
                              : m.role === "MODERATOR"
                              ? "secondary"
                              : "default"
                          }
                          size="small"
                        />
                      </Box>
                      {m.role !== "ADMIN" && canManageMembers && (
                        <Box>
                          <IconButton
                            size="small"
                            // ✅ confirm before remove member
                            onClick={() => confirmRemoveMember(m)}
                            color="error"
                          >
                            <MdDelete />
                          </IconButton>
                        </Box>
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {/* New members list with selectable rows */}
            {canManageMembers && (
              <>
                {loadingUsers ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : availableUsers.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography color="textSecondary">
                      No new members available
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}>
                    <Stack spacing={1}>
                      {availableUsers.map((u) => {
                        const isSelected = selectedUsers.some(
                          (s) => s.id === u.id
                        );
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
                              borderColor: isSelected
                                ? "primary.main"
                                : "divider",
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
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddMembers(false)}>Cancel</Button>
          {canManageMembers && (
            <Button
              onClick={handleAddMembers}
              variant="contained"
              disabled={selectedUsers.length === 0 || loadingUsers}
            >
              Add Members
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ✅ Confirm Delete Dialog (reused for message delete + member remove) */}
      <Dialog open={confirmOpen} onClose={closeConfirm} maxWidth="xs" fullWidth>
        <DialogTitle>{confirmTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDescription}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
