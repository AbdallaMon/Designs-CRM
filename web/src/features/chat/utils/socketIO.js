import io from "socket.io-client";

export let socket = null;

/**
 * Initialize Socket.IO connection
 * @param {string} url - Backend URL (e.g., http://localhost:3001)
 * @param {object} options - Socket.IO options
 * @returns {object} Socket instance
 */
export const initSocket = (url, options = {}) => {
  if (socket) {
    return socket;
  }

  socket = io(url, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
    transports: ["websocket", "polling"],
    withCredentials: true,
    ...options,
  });

  // Global event listeners
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("⚠️ Socket disconnected:", reason);
  });

  socket.on("error", (error) => {
    console.error("⚠️ Socket.IO error:", error);
  });

  // Universal message listener to log ALL incoming events (for debugging)
  socket.onAny((event, ...args) => {
    if (!event.includes("ping") && !event.includes("pong")) {
    }
  });

  return socket;
};

/**
 * Get existing Socket.IO connection
 * @returns {object} Socket instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect Socket.IO
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Emit event to server
 * @param {string} event - Event name
 * @param {any} data - Data to send
 */
export const emitSocket = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data);
  } else {
    console.warn(`⚠️ [Socket] Cannot emit "${event}" - Socket not connected`);
  }
};

/**
 * Listen to Socket.IO event
 * @param {string} event - Event name
 * @param {function} callback - Callback function
 */
export const onSocket = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Remove Socket.IO event listener
 * @param {string} event - Event name
 * @param {function} callback - Callback function
 */
export const offSocket = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

/**
 * Join a chat room namespace
 * @param {number} roomId - Chat room ID
 * @param {object} user - User object
 */
export const joinChatRoom = (roomId) => {
  emitSocket("join_room", { roomId });
};
export const joinChatRoomAsClient = (roomId) => {
  emitSocket("join_room_client", { roomId });
};

/**
 * Leave a chat room namespace
 * @param {number} roomId - Chat room ID
 */
export const leaveChatRoom = (roomId) => {
  emitSocket("leave_room", { roomId });
};

export const typing = ({ roomId }) => {
  emitSocket("user:typing", { roomId });
};

export const emitStopTyping = ({ roomId }) => {
  emitSocket("user:stop_typing", { roomId });
};
export const sendNewMessage = ({ data }) => {
  emitSocket("message:create", { data });
};
export const emitEditMessage = ({ messageId, roomId, content }) => {
  emitSocket("message:edit", { messageId, roomId, content });
};
export const emitDeleteMessage = ({ messageId, roomId }) => {
  emitSocket("message:delete", { messageId, roomId });
};
export const emitPinMessage = ({ messageId, roomId }) => {
  emitSocket("message:pin", { messageId, roomId });
};
export const emitUnpinMessage = ({ messageId, roomId }) => {
  emitSocket("message:unpin", { messageId, roomId });
};
export const isOnline = () => {
  emitSocket("online");
};

/**
 * Mark all messages in a room as read
 * @param {number} roomId - Chat room ID
 */
export const markMessagesRead = (roomId) => {
  emitSocket("messages:mark_read", { roomId });
};

/**
 * Mark specific message as read
 * @param {number} roomId - Chat room ID
 * @param {number} messageId - Message ID
 */
export const markMessageAsRead = (roomId, messageId) => {
  emitSocket("message:mark_read", { roomId, messageId });
};

export const forwardMultipleMessages = ({ roomsIds, messageIds }) => {
  emitSocket("messages:forward", { roomsIds, messageIds });
};
