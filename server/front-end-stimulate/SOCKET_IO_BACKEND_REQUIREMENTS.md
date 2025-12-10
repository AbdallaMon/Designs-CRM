# Socket.IO Backend Implementation Guide

## Overview

This document outlines all Socket.IO events and namespaces required for real-time chat functionality in the Dream Studio application.

---

## Installation & Setup

### Required Packages

```bash
npm install socket.io express cors dotenv
# or for existing express server
npm install socket.io
```

### Server Setup (Node.js/Express Example)

```javascript
const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;

  if (!token || !userId) {
    return next(new Error("Authentication error"));
  }

  // Verify token (implement based on your auth system)
  // const user = verifyToken(token);
  // if (!user) return next(new Error("Invalid token"));

  socket.userId = userId;
  socket.token = token;
  next();
});

// Start server
server.listen(3001, () => {
  console.log("Socket.IO server running on port 3001");
});

module.exports = { io };
```

### Frontend Connection

The frontend already handles Socket.IO connection initialization via `socketIO.js`:

```javascript
// In ChatWindow.jsx - already configured
const { isConnected, typingUsers, onlineUsers, emitTyping } = useSocketIO(
  room?.id,
  { enabled: !!room?.id }
);
```

**Environment Variable Required:**

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001  # Backend Socket.IO URL
# OR defaults to NEXT_PUBLIC_URL
```

---

## Socket.IO Events

### Connection Events

#### `connect`

**Triggered:** When client connects to server

**Frontend:** Automatically handled by `socketIO.js`

**Backend Implementation:**

```javascript
io.on("connection", (socket) => {
  console.log(`User ${socket.userId} connected: ${socket.id}`);

  // Store online users
  socket.join(`user:${socket.userId}`);

  // Broadcast user is online
  io.emit("user:online", {
    userId: socket.userId,
    socketId: socket.id,
    timestamp: new Date(),
  });
});
```

#### `disconnect`

**Triggered:** When client disconnects

**Backend Implementation:**

```javascript
socket.on("disconnect", () => {
  console.log(`User ${socket.userId} disconnected`);

  // Broadcast user is offline
  io.emit("user:offline", {
    userId: socket.userId,
    timestamp: new Date(),
  });
});
```

---

### Room Events

#### `join_room`

**Emitted By:** Client when entering a chat room

**Event Data:**

```json
{
  "roomId": 1
}
```

**Backend Implementation:**

```javascript
socket.on("join_room", (data) => {
  const { roomId } = data;

  // Remove from previous rooms
  socket.rooms.forEach((room) => {
    if (room !== socket.id) {
      socket.leave(room);
    }
  });

  // Join new room
  socket.join(`room:${roomId}`);

  // Notify others
  io.to(`room:${roomId}`).emit("member:joined", {
    userId: socket.userId,
    roomId: roomId,
    timestamp: new Date(),
  });

  console.log(`User ${socket.userId} joined room ${roomId}`);
});
```

#### `leave_room`

**Emitted By:** Client when leaving a chat room

**Event Data:**

```json
{
  "roomId": 1
}
```

**Backend Implementation:**

```javascript
socket.on("leave_room", (data) => {
  const { roomId } = data;

  socket.leave(`room:${roomId}`);

  // Notify others
  io.to(`room:${roomId}`).emit("member:left", {
    userId: socket.userId,
    roomId: roomId,
    timestamp: new Date(),
  });

  console.log(`User ${socket.userId} left room ${roomId}`);
});
```

---

### Message Events

#### `message:send` (Optional - REST API preferred)

**Note:** Messages are primarily sent via REST API (`POST /shared/chat/rooms/{roomId}/messages`). Use Socket.IO for real-time broadcast only.

**Backend Implementation:**

```javascript
socket.on("message:send", async (data) => {
  const { roomId, content, type = "TEXT" } = data;

  // Validate permission
  const member = await ChatMember.findOne({
    where: { roomId, userId: socket.userId },
  });

  if (!member) {
    socket.emit("error", "Not a member of this room");
    return;
  }

  // Save message via REST API or database
  const message = await ChatMessage.create({
    roomId,
    senderId: socket.userId,
    content,
    type,
  });

  // Broadcast to all members in room
  io.to(`room:${roomId}`).emit("message:new", {
    id: message.id,
    roomId,
    senderId: socket.userId,
    content,
    type,
    createdAt: message.createdAt,
    sender: {
      id: socket.userId,
      name: socket.userName,
    },
  });
});
```

#### `message:new`

**Triggered:** When a new message arrives (from other users)

**Broadcast By:** Backend to room members

**Event Data:**

```json
{
  "id": 123,
  "roomId": 1,
  "senderId": 5,
  "content": "Hello team!",
  "type": "TEXT",
  "fileUrl": null,
  "createdAt": "2025-01-01T10:00:00Z",
  "sender": {
    "id": 5,
    "name": "John Doe"
  }
}
```

**Frontend Handler:** Already implemented in `useSocketIO.js`

```javascript
onNewMessage: (data) => {
  // Update messages list
};
```

#### `message:edited`

**Emitted By:** Client when editing a message

**Event Data:**

```json
{
  "messageId": 123,
  "content": "Updated content"
}
```

**Backend Implementation:**

```javascript
socket.on("message:edit", async (data) => {
  const { messageId, content, roomId } = data;

  const message = await ChatMessage.findByPk(messageId);

  if (!message) {
    socket.emit("error", "Message not found");
    return;
  }

  if (message.senderId !== socket.userId) {
    socket.emit("error", "Not authorized to edit this message");
    return;
  }

  message.content = content;
  message.isEdited = true;
  await message.save();

  // Broadcast edit to room
  io.to(`room:${roomId}`).emit("message:edited", {
    messageId,
    content,
    updatedAt: message.updatedAt,
  });
});
```

#### `message:deleted`

**Triggered:** When a message is deleted

**Event Data:**

```json
{
  "messageId": 123,
  "roomId": 1
}
```

**Backend Implementation:**

```javascript
socket.on("message:delete", async (data) => {
  const { messageId, roomId } = data;

  const message = await ChatMessage.findByPk(messageId);

  if (!message) {
    socket.emit("error", "Message not found");
    return;
  }

  if (message.senderId !== socket.userId) {
    socket.emit("error", "Not authorized to delete this message");
    return;
  }

  await message.destroy();

  // Broadcast deletion
  io.to(`room:${roomId}`).emit("message:deleted", {
    messageId,
    roomId,
  });
});
```

---

### Typing Indicators

#### `user:typing`

**Emitted By:** Client when user starts typing

**Event Data:**

```json
{
  "roomId": 1,
  "userId": 5
}
```

**Backend Implementation:**

```javascript
socket.on("user:typing", (data) => {
  const { roomId } = data;

  // Broadcast to room (except sender)
  socket.to(`room:${roomId}`).emit("user:typing", {
    userId: socket.userId,
    roomId: roomId,
    timestamp: new Date(),
  });
});
```

#### `user:stop_typing`

**Emitted By:** Client when user stops typing

**Event Data:**

```json
{
  "roomId": 1,
  "userId": 5
}
```

**Backend Implementation:**

```javascript
socket.on("user:stop_typing", (data) => {
  const { roomId } = data;

  // Broadcast to room (except sender)
  socket.to(`room:${roomId}`).emit("user:stop_typing", {
    userId: socket.userId,
    roomId: roomId,
  });
});
```

---

### Member Events

#### `member:joined`

**Triggered:** When a user joins a room

**Broadcast By:** Backend

**Event Data:**

```json
{
  "userId": 5,
  "roomId": 1,
  "timestamp": "2025-01-01T10:00:00Z"
}
```

#### `member:left`

**Triggered:** When a user leaves a room

**Broadcast By:** Backend

**Event Data:**

```json
{
  "userId": 5,
  "roomId": 1,
  "timestamp": "2025-01-01T10:00:00Z"
}
```

---

### Call Events

#### `call:initiated`

**Emitted By:** Client initiating a call

**Event Data:**

```json
{
  "callType": "AUDIO",
  "roomId": 1,
  "initiatedBy": 5
}
```

**Backend Implementation:**

```javascript
socket.on("call:initiated", (data) => {
  const { callType, roomId } = data;

  // Save call record to database
  const call = await Call.create({
    roomId,
    initiatedById: socket.userId,
    callType,
    status: "RINGING",
  });

  // Broadcast to room
  io.to(`room:${roomId}`).emit("call:initiated", {
    callId: call.id,
    callType,
    initiatedBy: socket.userId,
    timestamp: new Date(),
  });
});
```

#### `call:answered`

**Emitted By:** Client answering a call

**Event Data:**

```json
{
  "callId": 123,
  "roomId": 1
}
```

**Backend Implementation:**

```javascript
socket.on("call:answered", async (data) => {
  const { callId, roomId } = data;

  const call = await Call.findByPk(callId);
  if (call) {
    call.status = "ONGOING";
    await call.save();
  }

  // Add participant
  await CallParticipant.create({
    callId,
    userId: socket.userId,
    joinedAt: new Date(),
  });

  io.to(`room:${roomId}`).emit("call:answered", {
    callId,
    answeredBy: socket.userId,
  });
});
```

#### `call:ended`

**Emitted By:** Client ending a call

**Event Data:**

```json
{
  "callId": 123,
  "roomId": 1
}
```

**Backend Implementation:**

```javascript
socket.on("call:ended", async (data) => {
  const { callId, roomId } = data;

  const call = await Call.findByPk(callId);
  if (call) {
    call.status = "ENDED";
    call.endedAt = new Date();
    await call.save();
  }

  io.to(`room:${roomId}`).emit("call:ended", {
    callId,
    endedBy: socket.userId,
  });
});
```

---

### Online/Offline Status

#### `user:online`

**Triggered:** When a user connects

**Broadcast By:** Backend

**Event Data:**

```json
{
  "userId": 5,
  "socketId": "socket123",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

#### `user:offline`

**Triggered:** When a user disconnects

**Broadcast By:** Backend

**Event Data:**

```json
{
  "userId": 5,
  "timestamp": "2025-01-01T10:00:00Z"
}
```

---

## Real-time Features Implementation Checklist

- [ ] Socket.IO server initialization with proper CORS config
- [ ] Authentication middleware (validate user token)
- [ ] `join_room` event handler
- [ ] `leave_room` event handler
- [ ] `user:typing` event handler
- [ ] `user:stop_typing` event handler
- [ ] `message:edit` event handler
- [ ] `message:delete` event handler
- [ ] `call:initiated` event handler
- [ ] `call:answered` event handler
- [ ] `call:ended` event handler
- [ ] User online/offline tracking
- [ ] Error handling for auth failures
- [ ] Database updates for call records
- [ ] Namespace support (optional, for better organization)

---

## Testing Socket.IO Events

### Using Socket.IO Client Library

```javascript
const { io } = require("socket.io-client");

const socket = io("http://localhost:3001", {
  auth: {
    token: "your-token",
    userId: 1,
  },
});

socket.on("connect", () => {
  console.log("Connected");

  // Join a room
  socket.emit("join_room", { roomId: 1 });

  // Simulate typing
  socket.emit("user:typing", { roomId: 1 });

  // Simulate message
  socket.emit("message:send", {
    roomId: 1,
    content: "Hello!",
    type: "TEXT",
  });
});
```

### Testing Broadcast

Use two different clients to test:

1. Client A joins room 1
2. Client B joins room 1
3. Client A types → Client B should see typing indicator
4. Client A sends message → Client B should receive in real-time

---

## Performance Optimization

### Namespaces (Optional)

```javascript
const chatNamespace = io.of("/chat");

chatNamespace.on("connection", (socket) => {
  // Chat-specific events
});
```

### Rate Limiting

```javascript
const socketIOLimiter = {
  "message:send": { maxEvents: 10, duration: 60000 }, // 10 messages per minute
  "user:typing": { maxEvents: 30, duration: 60000 }, // 30 typing events per minute
};

// Implement rate limiting middleware
```

### Message Queuing

Consider using Redis for:

- Storing online users
- Message queueing
- Cross-server communication (if multiple Socket.IO servers)

---

## Troubleshooting

### Client not connecting

- Check `NEXT_PUBLIC_SOCKET_URL` environment variable
- Verify CORS configuration
- Check browser console for errors
- Ensure server is running

### Messages not broadcasting

- Verify client joined room with `join_room` event
- Check backend console for errors
- Verify user has permission to access room

### Typing indicators not showing

- Check `user:typing` and `user:stop_typing` events are being emitted
- Verify room subscription
- Check frontend handler in `useSocketIO.js`

---

## Security Considerations

1. **Authentication:** Always verify user token before allowing Socket.IO connection
2. **Authorization:** Validate user has access to room before broadcasting events
3. **Rate Limiting:** Limit events to prevent abuse
4. **Input Validation:** Sanitize all incoming data
5. **CORS:** Configure CORS properly for production domain
6. **HTTPS/WSS:** Use secure WebSocket (WSS) in production

---

## Production Deployment

### Environment Variables

```env
SOCKET_IO_PORT=3001
SOCKET_IO_CORS_ORIGIN=https://yourdomain.com
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://... # Optional for scaling
```

### Scaling with Redis Adapter

```javascript
const redisClient = require("redis").createClient(process.env.REDIS_URL);
const { createAdapter } = require("@socket.io/redis-adapter");

io.adapter(createAdapter(redisClient));
```

This allows Socket.IO to work across multiple server instances.

---

## Summary

The frontend Socket.IO integration is complete and ready. Backend team needs to:

1. Set up Socket.IO server with listed event handlers
2. Implement all 11 events listed in "Socket.IO Events" section
3. Add authentication middleware
4. Test with provided Socket.IO client code
5. Deploy to production with proper security and scaling

All frontend code will automatically connect and handle events once backend is ready.
