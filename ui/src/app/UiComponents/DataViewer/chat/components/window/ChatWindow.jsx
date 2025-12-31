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
  socket,
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
import { LoadMoreButton } from "../indicators/LoadMoreButton";
import { useChatRoom } from "../../hooks/useChatRoom";

export function ChatWindow({
  roomId,
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
  const inputRef = useRef(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const { room, loading: loadingRoom, fetchChatRoom } = useChatRoom(roomId);
  const [loadingPinnedMessages, setLoadingPinnedMessages] = useState(false);
  const fetchPinnedMessages = async () => {
    if (!roomId) return;

    const response = await getData({
      url: `shared/chat/${roomId}/pinned-messages`,
      setLoading: setLoadingPinnedMessages,
    });

    if (response?.status === 200) {
      setPinnedMessages(response.data || []);
    }
  };

  useEffect(() => {
    if (roomId) fetchPinnedMessages();
  }, [roomId]);

  // Get current user's role in the room

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
    loadMore,
  } = useChatMessages(roomId);
  const {
    members,
    loading: membersLoading,
    fetchMembers,
    setMembers,
  } = useChatMembers(roomId);
  const cantLoad = !hasMore || loadingMore || initialLoading || loading;
  const currentUserMember = members?.find(
    (m) => m.userId === user?.id || m.clientId === user?.id
  );
  const currentUserRole = currentUserMember?.role || "MEMBER";

  // Join room when it changes
  useEffect(() => {
    if (roomId && user && socket) {
      joinChatRoom(roomId, user);
    }
  }, [roomId, user, socket]);

  const emitTyping = useCallback(() => {
    typing({ roomId: roomId, user });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [roomId, user]);

  // Function to emit stop typing
  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    emitStopTyping({ roomId: roomId, user });
  }, [roomId, user]);

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
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data]);
        onRoomActivity?.(data);
        markMessageAsRead(roomId, data.id, user.id);

        setNewMessagesCount((prev) => prev + 1);
        // scrollToBottom();
        inputRef.current?.focus();
        window.setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    },
    onMessagePinned: (data) => {
      if (data.roomId === roomId) fetchPinnedMessages();
    },
    onMessageUnpinned: (data) => {
      if (data.roomId === roomId) fetchPinnedMessages();
    },
    onMessageEdited: (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, isEdited: true, ...data } : msg
          )
        );
      }
    },
    onMessageDeleted: (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, isDeleted: true } : msg
          )
        );
      }
    },
    onTyping: (data) => {
      if (data.roomId === roomId && data.userId !== user.id) {
        const key = `${data.userId}:${data.roomId}`;

        setTypingUsers((prev) => {
          const map = new Map(prev.map((u) => [`${u.userId}:${u.roomId}`, u]));
          map.set(key, data); // overwrite/update same user+room
          return Array.from(map.values());
        });
      }
    },
    onStopTyping: (data) => {
      if (data.roomId === roomId) {
        setTypingUsers((prev) =>
          prev.filter((items) => items.userId !== data.userId)
        );
      }
    },
    onMemberJoined: (data) => {
      if (data.roomId === roomId) {
        setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    },
    onMemberLeft: (data) => {
      if (data.roomId === roomId) {
        setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    },
    onMembersAdded: (data) => {
      if (data.roomId === roomId) {
        setNewMembersAdded(data.newMembers);
        setNewMemberAlertOpen(true);
      }
    },
    onRoomUpdatedEvent: (data) => {
      console.log(data, "data");
      console.log(roomId, "roomId");
      if (data.roomId === roomId) {
        fetchChatRoom();
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
      attachments: fileData ? fileData.attachments : [],
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
      `shared/chat/rooms/${roomId}/members`,
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
      `shared/chat/rooms/${roomId}/members/${memberId}`,
      false,
      "Removing member",
      false,
      "DELETE"
    );
    if (response?.status === 200) {
      fetchMembers();
    }
  };
  const toggleSelectUser = useCallback((userToToggle) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((u) => u.id === userToToggle.id);
      if (exists) {
        return prev.filter((u) => u.id !== userToToggle.id);
      }
      return [...prev, userToToggle];
    });
  }, []);

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
        roomId: roomId,
        userId: user?.id,
      });
    },
    [roomId, user?.id]
  );
  const handleUnPinMessage = useCallback(
    (message) => {
      emitUnpinMessage({
        messageId: message.id,
        roomId: roomId,
        userId: user?.id,
      });
    },
    [roomId, user?.id]
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
          height: {
            xs: "calc(100vh - 62px)",
            md: "calc(100vh - 86px)",
          },

          color: "textSecondary",
        }}
      >
        <Typography>Select a chat to start messaging</Typography>
      </Box>
    );
  }
  // const toggleSelectUser = () => {};

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        height: { xs: "calc(100vh - 62px)", md: "calc(100vh - 115px)" },
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <ChatWindowHeader
        roomId={roomId}
        onClose={onClose}
        isMobile={isMobile}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isNotDirectChat={isNotDirectChat}
        onShowAddMembers={() => setShowAddMembers(true)}
        members={members}
        reFetchRooms={reFetchRooms}
        fetchMembers={fetchMembers}
        fetchChatRoom={fetchChatRoom}
        loading={loadingRoom}
        room={room}
      />
      <PinnedMessages
        roomId={roomId}
        handleJumpToMessage={onJumpToMessage}
        loadingJumpToMessage={loadingJumpToMessage}
        chatContainerRef={scrollContainerRef}
        pinnedMessages={pinnedMessages}
        setPinnedMessages={setPinnedMessages}
        loadingPinnedMessages={loadingPinnedMessages}
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
            pb: 0,
            display: "flex",
            flexDirection: "column",
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
          <LoadMoreButton
            disabled={cantLoad}
            onClick={loadMore}
            loadingMore={loadingMore}
          />
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
                  pinnedMessages={pinnedMessages}
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
                sx={
                  {
                    // position: "sticky",
                    // bottom: 0,
                  }
                }
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
            inputRef={inputRef}
            disabled={
              (!isMember && !isAdmin) || (!isAdmin && !room.isChatEnabled)
            }
            onTyping={emitTyping}
          />
        </Box>
      </>

      <ChatFilesTab
        roomId={roomId}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

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
        reFetchMembers={fetchMembers}
        clientLeadId={clientLeadId}
        roomId={roomId}
        reFetchRoom={fetchChatRoom}
        accessToken={room?.chatAccessToken}
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
