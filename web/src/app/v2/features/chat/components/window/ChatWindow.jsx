"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Paper, Typography, CircularProgress, Alert, Snackbar } from "@mui/material";
import { CHAT_ROOM_TYPES } from "../../config/chatConstants.js";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { useSocket } from "@/app/v2/providers/SocketProvider";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { ChatMessage } from "../messages/ChatMessage.jsx";
import { ChatInput } from "../messages/ChatInput.jsx";
import { ChatFilesTab } from "../messages/ChatFilesTab.jsx";
import { ScrollButton } from "../messages/ScrollButton.jsx";
import { MultiActions } from "../messages/MultiActions.jsx";
import { LoadMoreButton } from "../indicators/LoadMoreButton.jsx";
import { ChatTypingIndicator } from "../indicators/ChatTypingIndicator.jsx";
import { NewMemberAlert } from "../indicators/NewMemberAlert.jsx";
import { ConfirmDialog } from "../dialogs/ConfirmDialog.jsx";
import { AddMembersDialog } from "../dialogs/AddMembersDialog.jsx";
import { ForwardMessagesDialog } from "../dialogs/ForwardMessagesDialog.jsx";
import { ChatWindowHeader } from "./ChatWindowHeader.jsx";
import { PinnedMessages } from "./PinnedMessages.jsx";
import { useChatMessages, useChatMembers, useChatRoom } from "../../hooks";
import { useChatSocket, chatEmit } from "../../chat.socket.js";
import chatService from "../../chat.service.js";
import { runChatMutation } from "../../chat.mutations.js";
import { isAdminRole } from "../../chat.utils.js";

export function ChatWindow({
  roomId,
  onClose,
  projectId = null,
  isMobile = false,
  onRoomActivity = () => {},
  reFetchRooms = () => {},
}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { hasPermission } = usePermission();

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [newMembersAdded, setNewMembersAdded] = useState([]);
  const [newMemberAlertOpen, setNewMemberAlertOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loadingPinnedMessages, setLoadingPinnedMessages] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [openForwardDialog, setOpenForwardDialog] = useState(false);

  const { room, loading: loadingRoom, fetchChatRoom, error } = useChatRoom(roomId);

  // ── Confirm dialog plumbing ──
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("تأكيد");
  const [confirmDescription, setConfirmDescription] = useState("");
  const confirmActionRef = useRef(null);
  const openConfirm = useCallback((title, description, onConfirm) => {
    setConfirmTitle(title || "تأكيد");
    setConfirmDescription(description || "");
    confirmActionRef.current = onConfirm;
    setConfirmOpen(true);
  }, []);
  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    confirmActionRef.current = null;
  }, []);
  const handleConfirm = useCallback(async () => {
    const fn = confirmActionRef.current;
    closeConfirm();
    if (typeof fn === "function") await fn();
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
    setNewMessagesCount,
    loadMore,
    deleteSelectedMessages,
  } = useChatMessages(roomId, 0);

  const { members, fetchMembers } = useChatMembers(roomId, showAddMembers);
  const cantLoad = !hasMore || loadingMore || initialLoading || loading;
  const currentUserMember = members?.find((m) => m.userId === user?.id);
  const currentUserRole = currentUserMember?.role || "MEMBER";

  const fetchPinnedMessages = useCallback(async () => {
    if (!roomId) return;
    setLoadingPinnedMessages(true);
    try {
      const res = await chatService.listPinnedMessages(roomId);
      setPinnedMessages(res?.data ?? []);
    } finally {
      setLoadingPinnedMessages(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) fetchPinnedMessages();
  }, [roomId, fetchPinnedMessages]);

  // join room on socket
  useEffect(() => {
    if (roomId && user && socket?.connected) chatEmit.joinRoom(socket, roomId, user);
  }, [roomId, user, socket, socket?.connected]);

  // mark room read on open (POST /rooms/:id/read) — gated by MESSAGE_SEND.
  // BE derives the user from auth; no body is needed (it ignores userId).
  useEffect(() => {
    if (roomId && hasPermission(PERMISSIONS.CHAT.MESSAGE_SEND)) {
      chatService.readRoom(roomId, {}).catch(() => {});
    }
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const emitTyping = useCallback(() => {
    chatEmit.typing(socket, { roomId, user });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      clearTimeout(typingTimeoutRef.current);
      chatEmit.stopTyping(socket, { roomId, user });
    }, 3000);
  }, [roomId, user, socket]);

  useEffect(() => {
    if (newMemberAlertOpen) {
      const timer = setTimeout(() => {
        setNewMemberAlertOpen(false);
        setNewMembersAdded([]);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [newMemberAlertOpen]);

  useChatSocket({
    onMessageCreated: (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data]);
        onRoomActivity?.(data);
        chatEmit.markMessageRead(socket, roomId, data.id, user.id);
        setNewMessagesCount((p) => p + 1);
        inputRef.current?.focus();
        window.setTimeout(() => scrollToBottom(), 100);
      }
    },
    onMessagePinned: (data) => data.roomId === roomId && fetchPinnedMessages(),
    onMessageUnpinned: (data) => data.roomId === roomId && fetchPinnedMessages(),
    onMessageEdited: (data) => {
      if (data.roomId === roomId)
        setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, isEdited: true, ...data } : m)));
    },
    onMessageDeleted: (data) => {
      if (data.roomId === roomId)
        setMessages((prev) => prev.map((m) => (m.id === data.messageId ? { ...m, isDeleted: true } : m)));
    },
    onTyping: (data) => {
      if (data.roomId === roomId && data.userId !== user.id) {
        const key = `${data.userId}:${data.roomId}`;
        setTypingUsers((prev) => {
          const map = new Map(prev.map((u) => [`${u.userId}:${u.roomId}`, u]));
          map.set(key, data);
          return Array.from(map.values());
        });
      }
    },
    onStopTyping: (data) => {
      if (data.roomId === roomId) setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    },
    onMembersAdded: (data) => {
      if (data.roomId === roomId) {
        setNewMembersAdded(data.newMembers);
        setNewMemberAlertOpen(true);
      }
    },
    onMemberRoleUpdated: (data) => {
      if (data.userId === user.id && data.roomId === roomId) {
        fetchMembers();
        fetchChatRoom();
      }
    },
    onRoomUpdatedEvent: (data) => data.roomId === roomId && fetchChatRoom(),
    onChatError: (data) => {
      setChatError(data.message);
      window.setTimeout(() => setChatError(null), 5000);
    },
  });

  // ── capability + permission gating ──
  const isNotDirectChat = room?.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF;
  const canManageMembers =
    hasPermission(PERMISSIONS.CHAT.MEMBER_MANAGE) &&
    Boolean(room?.capabilities?.canManageMembers) &&
    isNotDirectChat;
  const isCurrentUserAdmin = isAdminRole(user) || room?.createdBy?.id === user.id;
  const isMember = members?.some((m) => m.userId === user.id);

  const handleSendMessage = async (content, fileData) => {
    const messageData = {
      content,
      replyToId: replyingTo?.id,
      type: fileData ? "FILE" : "TEXT",
      attachments: fileData ? fileData.attachments : [],
    };
    await sendMessage(messageData);
    setReplyingTo(null);
  };

  const handleAddMembers = async () => {
    const res = await runChatMutation(
      () => chatService.addMembers(roomId, { userIds: selectedUsers.map((u) => u.id) }),
      { loading: "جاري إضافة الأعضاء..." },
    );
    if (res) {
      fetchMembers();
      setSelectedUsers([]);
    }
  };

  const handleRemoveMember = async (memberId) => {
    const res = await runChatMutation(
      () => chatService.removeMember(roomId, memberId),
      { loading: "جاري إزالة العضو..." },
    );
    if (res) fetchMembers();
  };

  const toggleSelectUser = useCallback((u) => {
    setSelectedUsers((prev) =>
      prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u],
    );
  }, []);

  const confirmRemoveMember = useCallback(
    (member) => {
      const name = member?.user?.name || member?.client?.name || "هذا العضو";
      openConfirm("إزالة العضو؟", `هل تريد إزالة ${name} من المحادثة؟`, () => handleRemoveMember(member.id));
    },
    [openConfirm], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const confirmDeleteMessage = useCallback(
    (payload) => {
      const msgId = typeof payload === "object" && payload?.id ? payload.id : payload;
      if (!msgId) return;
      openConfirm("حذف الرسالة؟", "سيتم حذف الرسالة للجميع في المحادثة.", () => deleteMessage(msgId));
    },
    [openConfirm, deleteMessage],
  );

  const confirmDeleteSelectedMessages = useCallback(() => {
    openConfirm("حذف الرسائل؟", "سيتم حذف الرسائل للجميع في المحادثة.", async () => {
      await deleteSelectedMessages(selectedMessages);
      setSelectedMessages([]);
    });
  }, [openConfirm, deleteSelectedMessages, selectedMessages]);

  const handlePinMessage = useCallback(
    (message) => chatEmit.pinMessage(socket, { messageId: message.id, roomId, userId: user?.id }),
    [roomId, user?.id, socket],
  );
  const handleUnPinMessage = useCallback(
    (message) => chatEmit.unpinMessage(socket, { messageId: message.id, roomId, userId: user?.id }),
    [roomId, user?.id, socket],
  );

  // available users for add-members. The users module is not migrated to /v2, so the
  // directory is served by the LEGACY base via chatService.listDirectoryUsers
  // (admin/all-users for admins, shared/all-related-chat-users for normal users).
  // Legacy returns the user array directly under response.data.
  // TODO: switch to /v2/users when users module migrates.
  const loadAvailableUsers = useCallback(async () => {
    if (!isNotDirectChat || !canManageMembers) return;
    setLoadingUsers(true);
    try {
      const res = await chatService.listDirectoryUsers({
        isAdmin: isAdminRole(user),
        projectId,
      });
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.items ?? []);
      const alreadyMembers = members.filter((m) => m.userId).map((m) => m.userId);
      setAvailableUsers(list.filter((u) => !alreadyMembers.includes(u.id)));
    } catch {
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [isNotDirectChat, canManageMembers, projectId, members, user]);

  useEffect(() => {
    if (showAddMembers && isNotDirectChat) loadAvailableUsers();
  }, [showAddMembers, isNotDirectChat, members]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (messagesEndRef.current && initialLoading) scrollToBottom();
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!room) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: { xs: "calc(100vh - 62px)", md: "calc(100vh - 105px)" }, color: "textSecondary" }}>
        <Typography>اختر محادثة لبدء المراسلة</Typography>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        height: { xs: "calc(100vh - 62px)", md: "calc(100vh - 105px)" },
        bgcolor: "background.paper",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {error && <Alert severity="error">{error}</Alert>}
      {chatError && (
        <Snackbar open={Boolean(chatError)} autoHideDuration={6000} onClose={() => setChatError(null)}>
          <Alert onClose={() => setChatError(null)} severity="error" sx={{ width: "100%" }}>
            {chatError}
          </Alert>
        </Snackbar>
      )}

      <ChatWindowHeader
        onClose={onClose}
        isMobile={isMobile}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isNotDirectChat={isNotDirectChat}
        onShowAddMembers={() => setShowAddMembers(true)}
        reFetchRooms={reFetchRooms}
        fetchChatRoom={fetchChatRoom}
        loading={loadingRoom}
        room={room}
      />

      <PinnedMessages
        handleJumpToMessage={onJumpToMessage}
        loadingJumpToMessage={loadingJumpToMessage}
        chatContainerRef={scrollContainerRef}
        pinnedMessages={pinnedMessages}
        loadingPinnedMessages={loadingPinnedMessages}
      />

      <Box ref={scrollContainerRef} sx={{ flex: 1, overflow: "auto", p: 2, pb: 0, display: "flex", flexDirection: "column", position: "relative" }}>
        <LoadMoreButton disabled={cantLoad} onClick={loadMore} loadingMore={loadingMore} />
        {messagesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, color: "textSecondary" }}>
            <Typography>لا توجد رسائل بعد. ابدأ المحادثة!</Typography>
          </Box>
        ) : (
          <>
            <div ref={messagesStartRef} />
            {!hasMore && (
              <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: "textSecondary", mb: 1 }}>
                لا مزيد من الرسائل
              </Typography>
            )}
            {loadingMore && <CircularProgress />}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                currentUserId={user.id}
                isCurrentUserAdmin={isCurrentUserAdmin}
                currentUserRole={currentUserRole}
                pinnedMessages={pinnedMessages}
                room={room}
                onReply={setReplyingTo}
                onPin={handlePinMessage}
                onUnPin={handleUnPinMessage}
                onDelete={confirmDeleteMessage}
                loadingReplayJump={loadingJumpToMessage}
                onJumpToMessage={onJumpToMessage}
                replyLoaded={replyLoaded}
                setReplyLoaded={setReplyLoaded}
                replayLoadingMessageId={replayLoadingMessageId}
                setReplayLoadingMessageId={setReplayLoadingMessageId}
                selectedMessages={selectedMessages}
                setSelectedMessages={setSelectedMessages}
              />
            ))}
            <ScrollButton containerRef={scrollContainerRef} direction="down" threshold={300} />
            <Box ref={messagesEndRef} />
          </>
        )}
        <ChatTypingIndicator typingUsers={typingUsers} />
        <NewMemberAlert newMembersAdded={newMembersAdded} onClose={() => setNewMemberAlertOpen(false)} />
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
            !hasPermission(PERMISSIONS.CHAT.MESSAGE_SEND) ||
            (!isMember && !isCurrentUserAdmin) ||
            (!isCurrentUserAdmin && !room.isChatEnabled)
          }
          onTyping={emitTyping}
        />
      </Box>

      <ChatFilesTab roomId={roomId} currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <MultiActions
        selectedMessages={selectedMessages}
        setSelectedMessages={setSelectedMessages}
        onDelete={confirmDeleteSelectedMessages}
        openForwardDialog={openForwardDialog}
        setOpenForwardDialog={setOpenForwardDialog}
      />
      <ForwardMessagesDialog
        open={openForwardDialog}
        onClose={() => {
          setOpenForwardDialog(false);
          setSelectedMessages([]);
        }}
        selectedMessages={selectedMessages}
      />
      <AddMembersDialog
        open={showAddMembers}
        onClose={() => setShowAddMembers(false)}
        roomId={roomId}
        members={members}
        availableUsers={availableUsers}
        selectedUsers={selectedUsers}
        loadingUsers={loadingUsers}
        canManageMembers={canManageMembers}
        onToggleSelectUser={toggleSelectUser}
        onAddMembers={handleAddMembers}
        onRemoveMember={confirmRemoveMember}
        reFetchMembers={fetchMembers}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        onConfirm={handleConfirm}
        onCancel={closeConfirm}
        confirmButtonText="حذف"
        confirmButtonColor="error"
      />
    </Paper>
  );
}
