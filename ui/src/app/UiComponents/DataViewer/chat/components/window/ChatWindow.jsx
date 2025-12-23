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
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
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
  FaComments,
  FaFolder,
  FaTimes,
} from "react-icons/fa";
import {
  CHAT_ROOM_TYPE_LABELS,
  CHAT_ROOM_TYPES,
} from "../../utils/chatConstants";
import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  ChatMessage,
  ChatInput,
  ChatFilesTab,
  ScrollButton,
} from "../messages";
import { useChatMessages, useSocket } from "../../hooks";

import {
  markMessagesRead,
  markMessageAsRead,
  joinChatRoom,
  typing,
  emitStopTyping,
  emitPinMessage,
  emitUnpinMessage,
} from "../../utils/socketIO";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useChatMembers } from "../../hooks/useChatMembers";
import { LastSeenAt, OnlineStatus } from "../members/LastSeenAt";
import { AddMembersDialog } from "../members/AddMembersDialog";
import { ChatTypingIndicator } from "../indicators/ChatTypingIndicator";
import { NewMemberAlert } from "../indicators/NewMemberAlert";
import { ConfirmDialog } from "../dialogs/ConfirmDialog";
import PinnedMessages from "./PinnedMessages";
import { ChatWindowHeader } from "./ChatWindowHeader";

export function ChatWindow({
  room,
  onClose,
  projectId = null,
  clientLeadId = null,
  isMobile = false,
  onRoomActivity = () => {},
  reFetchRooms = () => {},
  setTotalUnread,
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
  // Get current user's role in the room
  const currentUserMember = room?.members?.find(
    (m) => m.userId === user?.id || m.clientId === user?.id
  );
  const currentUserRole = currentUserMember?.role || "MEMBER";

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
  const isAdminUser = checkIfAdmin(user);
  const isMember = members?.some((m) => m.userId === user.id);

  const isNotDirectChat = room?.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF;
  const canManageMembers = isAdmin && isNotDirectChat;

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

  // Handle pin message
  const handlePinMessage = useCallback(
    (message) => {
      emitPinMessage({
        messageId: message.id,
        roomId: room?.id,
        userId: user?.id,
      });
    },
    [room?.id, user?.id]
  );
  const handleUnPinMessage = useCallback(
    (message) => {
      emitUnpinMessage({
        messageId: message.id,
        roomId: room?.id,
        userId: user?.id,
      });
    },
    [room?.id, user?.id]
  );

  // ✅ Handler to remove unread count badge
  const handleRemoveUnreadCount = useCallback(
    (messageId) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, showUnreadCount: false } : msg
        )
      );
    },
    [setMessages]
  );

  const loadAvailableUsers = async (wait) => {
    if (!isNotDirectChat) return;
    setLoadingUsers(true);

    try {
      let url = isAdminUser
        ? `admin/all-users?`
        : `shared/all-related-chat-users?`;
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
      {/* Header Section */}
      <ChatWindowHeader
        room={room}
        roomLabel={roomLabel}
        onClose={onClose}
        isMobile={isMobile}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isNotDirectChat={isNotDirectChat}
        onShowAddMembers={() => setShowAddMembers(true)}
        members={members}
        reFetchRooms={reFetchRooms}
      />
      <PinnedMessages
        roomId={room?.id}
        handleJumpToMessage={onJumpToMessage}
        loadingJumpToMessage={loadingJumpToMessage}
        chatContainerRef={scrollContainerRef}
      />
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
            position: "relative",
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
          {/* Scroll to bottom button */}

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

              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  currentUserId={user.id}
                  isCurrentUserAdmin={isAdmin}
                  currentUserRole={currentUserRole}
                  room={room}
                  onReply={setReplyingTo}
                  onEdit={(msgId) => {
                    if (msgId) {
                      setEditingMessageId(msgId);
                    } else {
                      setEditingMessageId(null);
                    }
                  }}
                  onPin={handlePinMessage}
                  onUnPin={handleUnPinMessage}
                  // ✅ confirm before delete
                  onDelete={confirmDeleteMessage}
                  onRemoveUnreadCount={handleRemoveUnreadCount}
                  isEditing={editingMessageId === msg.id}
                  loadingReplayJump={loadingJumpToMessage}
                  onJumpToMessage={onJumpToMessage}
                  replyLoaded={replyLoaded}
                  setReplyLoaded={setReplyLoaded}
                  replayLoadingMessageId={replayLoadingMessageId}
                  setReplayLoadingMessageId={setReplayLoadingMessageId}
                />
              ))}
              <ScrollButton
                containerRef={scrollContainerRef}
                direction="down"
                threshold={300}
              />

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
          <ChatTypingIndicator typingUsers={typingUsers} />

          {/* New Member Alert */}
          <NewMemberAlert
            newMembersAdded={newMembersAdded}
            onClose={() => setNewMemberAlertOpen(false)}
          />
        </Box>

        <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <ChatInput
            onSendMessage={handleSendMessage}
            onReplyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            loading={messagesLoading}
            room={room}
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

      {/* Add Members Dialog */}
      <AddMembersDialog
        open={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        members={members}
        availableUsers={availableUsers}
        selectedUsers={selectedUsers}
        loadingUsers={loadingUsers}
        canManageMembers={canManageMembers}
        onToggleSelectUser={toggleSelectUser}
        onAddMembers={handleAddMembers}
        onRemoveMember={confirmRemoveMember}
        getAvatarSrc={getAvatarSrc}
      />

      {/* Confirm Dialog (reused for delete & remove) */}
      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
        confirmButtonText="Delete"
        confirmButtonColor="error"
      />
    </Paper>
  );
}
