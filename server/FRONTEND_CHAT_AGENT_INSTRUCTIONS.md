# Frontend Chat Implementation Guide

## Overview

Implement real-time chat functionality in the React frontend using Socket.IO and the backend API endpoints. This guide provides exact steps, expected responses, and Socket.IO event flows.

---

## Part 1: Socket.IO Connection Setup

### What to do:

1. **Initialize Socket.IO client** in your app's root component or context
2. **Connect to the backend** with user authentication
3. **Handle connection lifecycle** events (connect, disconnect, reconnect)
4. **Store socket instance** globally (context/Redux) for use across components

### Code Structure:

```
src/
├── contexts/
│   └── SocketContext.tsx          // Socket.IO provider
├── hooks/
│   ├── useSocketIO.ts             // Socket event listeners
│   └── useChatMessages.ts         // Message state management
└── services/
    └── chatApi.ts                 // API calls
```

### What to expect:

- Backend will emit `"connection"` event when client connects
- Socket connection requires `userId` query parameter: `socket.on('connect', () => { ... })`
- All Socket.IO events are namespaced to room-level or user-level operations
- Backend updates `User.lastSeenAt` on each new connection

---

## Part 2: Chat Rooms API Endpoints

### GET /shared/chat/rooms

**Purpose:** Fetch all rooms the user is member of with pagination

**Request:**

```
GET /shared/chat/rooms?page=0&limit=25
```

**Query Parameters:**

- `page`: Page number (0-indexed) | Default: 0
- `limit`: Items per page | Default: 25

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "type": "PROJECT_GROUP",
      "name": "Project XYZ - Design Team",
      "avatarUrl": "https://...",
      "isMuted": false,
      "isArchived": false,
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-20T15:30:00Z",
      "unreadCount": 3, // Messages from others since your lastReadAt
      "lastMessage": {
        "id": 45,
        "content": "Let me check the latest design",
        "senderId": 2,
        "senderName": "Ahmed",
        "createdAt": "2025-01-20T15:25:00Z",
        "type": "TEXT"
      },
      "members": [
        { "id": 1, "userId": 1, "role": "ADMIN", "name": "You" },
        { "id": 2, "userId": 2, "role": "MODERATOR", "name": "Ahmed" },
        { "id": 3, "userId": 3, "role": "MEMBER", "name": "Sarah" }
      ]
    }
  ],
  "pagination": {
    "total": 12,
    "page": 0,
    "limit": 25,
    "pages": 1
  },
  "message": "Chat rooms fetched"
}
```

**What to do:**

- Display room list with `unreadCount` badge (e.g., red circle showing "3")
- Show `lastMessage.content` preview (truncate if >50 chars)
- Show `lastMessage.senderName` in preview (e.g., "Ahmed: Let me check...")
- On pagination, increment `page` by 1 for next batch
- Store `unreadCount` per room for UI indicators

---

## Part 3: Messages API Endpoints

### GET /shared/chat/rooms/:roomId/messages

**Purpose:** Fetch chat history for a specific room

**Request:**

```
GET /shared/chat/rooms/1/messages?page=0&limit=50
```

**Query Parameters:**

- `page`: Page number (0-indexed) | Default: 0
- `limit`: Items per page | Default: 50

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 45,
      "roomId": 1,
      "senderId": 2,
      "senderName": "Ahmed",
      "type": "TEXT",
      "content": "Let me check the latest design",
      "fileUrl": null,
      "fileName": null,
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2025-01-20T15:25:00Z",
      "updatedAt": "2025-01-20T15:25:00Z",
      "replyTo": null,
      "readBy": [
        { "memberId": 1, "readAt": "2025-01-20T15:26:00Z" },
        { "memberId": 3, "readAt": "2025-01-20T15:27:00Z" }
      ]
    }
  ],
  "pagination": {
    "total": 234,
    "page": 0,
    "limit": 50,
    "pages": 5
  },
  "message": "Messages fetched"
}
```

**What to do:**

- Load messages on chat room open
- Display sender name and timestamp
- Show "Edited" label if `isEdited: true`
- Skip rendering if `isDeleted: true` (or show "Message deleted")
- For file messages: show download link instead of content
- For pagination: load older messages when scrolling up (increment page)

---

### POST /shared/chat/rooms/:roomId/messages

**Purpose:** Send a new message or file to a room

**Request (Text Message):**

```
POST /shared/chat/rooms/1/messages
Content-Type: application/json

{
  "content": "This is my message",
  "type": "TEXT"
}
```

**Request (File Upload):**

```
POST /shared/chat/rooms/1/messages
Content-Type: multipart/form-data

{
  "file": <binary>,
  "type": "FILE",
  "content": "Check this file out"  // Optional caption
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": 46,
    "roomId": 1,
    "senderId": 1,
    "senderName": "You",
    "type": "TEXT",
    "content": "This is my message",
    "fileUrl": null,
    "createdAt": "2025-01-20T15:30:00Z",
    "isEdited": false,
    "isDeleted": false
  },
  "message": "Message sent"
}
```

**What to do:**

- On successful send (201), add message to local state immediately (optimistic update)
- Clear input field after send
- Show loading spinner while sending
- On error (400/500), show error toast and keep message in input for retry
- Wait for Socket.IO `message:created` event to confirm (covered in Part 4)

---

### PUT /shared/chat/messages/:messageId

**Purpose:** Edit a sent message

**Request:**

```
PUT /shared/chat/messages/46
Content-Type: application/json

{
  "content": "This is my edited message"
}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 46,
    "content": "This is my edited message",
    "isEdited": true,
    "updatedAt": "2025-01-20T15:31:00Z"
  },
  "message": "Message updated"
}
```

**What to do:**

- Show edit modal/inline edit on message context menu
- Lock edit if message is >5 mins old (optional backend check)
- Update local state optimistically
- Set `isEdited: true` label on message UI

---

### DELETE /shared/chat/messages/:messageId

**Purpose:** Delete a sent message

**Request:**

```
DELETE /shared/chat/messages/46
```

**Response (200 OK):**

```json
{
  "message": "Message deleted"
}
```

**What to do:**

- Show "Delete?" confirmation before calling
- Remove from local state on success (or mark `isDeleted: true`)
- Remove message from UI after delete

---

### POST /shared/chat/read-all

**Purpose:** Batch mark multiple rooms as read (when user opens chat)

**Request:**

```
POST /shared/chat/read-all
Content-Type: application/json

{
  "roomIds": [1, 2, 3]
}
```

**Response (200 OK):**

```json
{
  "message": "Rooms marked as read"
}
```

**What to do:**

- Call this when user navigates to chat or focuses chat window
- Pass room IDs that have unread messages
- This will emit `message:read` event via Socket.IO to other users in those rooms

---

### POST /shared/chat/rooms/:roomId/read (or via Socket.IO)

**Purpose:** Mark specific room or message as read

**Via HTTP (Optional):**

```
POST /shared/chat/rooms/1/read
Content-Type: application/json

{
  "messageId": 45  // Optional: mark specific message
}
```

**Response (200 OK):**

```json
{
  "message": "Room marked as read"
}
```

**What to do:**

- Call this on room open OR use Socket.IO approach (Part 4)
- If marking room (no messageId), updates `ChatMember.lastReadAt` to now
- If marking message, creates ChatReadReceipt record

---

## Part 4: Socket.IO Real-Time Events

### Connection Setup

**On App Mount (or in useEffect):**

```typescript
// Expected to implement:
import io from "socket.io-client";

const socket = io("http://localhost:3000", {
  query: { userId: currentUser.id },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

**What to expect:**

- Backend will acknowledge connection
- `socket.on('connect')` fires when ready
- You can now emit/listen to events

---

### 1. Join Room (When user opens a chat room)

**Emit:**

```typescript
socket.emit("join_room", roomId);
// Example: socket.emit('join_room', 1);
```

**What to do:**

- Call immediately when user selects/opens a chat room
- This adds user to Socket.IO room and broadcasts `member:joined` event
- After emit, listen for real-time messages in this room

**What to expect:**

- Backend will broadcast `member:joined` event to other users in room
- You'll receive real-time `message:created` events for this room
- Backend updates `User.lastSeenAt`

---

### 2. Mark Room as Read (On room open)

**Emit:**

```typescript
socket.emit("message:mark_read", roomId);
// Example: socket.emit('message:mark_read', 1);
```

**What to do:**

- Emit immediately after `join_room` or when chat becomes visible
- Updates `ChatMember.lastReadAt` to now in database
- Clears unread count for this room

**What to expect:**

- Backend updates `ChatMember.lastReadAt` timestamp
- Backend broadcasts `message:read` event (you might listen to confirm)
- Next API call to `GET /shared/chat/rooms` will show `unreadCount: 0` for this room

---

### 3. Mark Specific Message as Read (Optional - on receive new message)

**Emit:**

```typescript
socket.emit("message:mark_read", roomId, messageId);
// Example: socket.emit('message:mark_read', 1, 46);
```

**What to do:**

- Optional: Call this immediately when receiving `message:created` event from other users
- Creates ChatReadReceipt record linking message + user
- Useful for showing "Seen by [names]" under messages

**What to expect:**

- Backend creates ChatReadReceipt entry
- Broadcasted `message:read` event includes memberId, messageId, readAt
- Other clients can show "Ahmed read at 3:30 PM" under message

---

### 4. Receive New Messages

**Listen:**

```typescript
socket.on("message:created", (message) => {
  // Handle incoming message
});
```

**Payload:**

```json
{
  "id": 47,
  "roomId": 1,
  "senderId": 3,
  "senderName": "Sarah",
  "type": "TEXT",
  "content": "Great design!",
  "fileUrl": null,
  "createdAt": "2025-01-20T15:35:00Z",
  "isEdited": false,
  "isDeleted": false
}
```

**What to do:**

- Add message to local state (this is the real-time update)
- Scroll to bottom of message list
- Play notification sound (optional)
- Show toast notification if room is not focused
- Update room's `lastMessage` in rooms list
- Optional: emit `message:mark_read(roomId, messageId)` immediately

---

### 5. Typing Indicator

**Emit when user starts typing:**

```typescript
socket.emit("user:typing", roomId);
```

**Stop typing (on blur or after 3 seconds of inactivity):**

```typescript
socket.emit("user:stop_typing", roomId);
```

**Listen for other users typing:**

```typescript
socket.on("user:typing", ({ roomId, userId, userName }) => {
  // Show "Ahmed is typing..."
});

socket.on("user:stop_typing", ({ roomId, userId }) => {
  // Hide typing indicator for Ahmed
});
```

**What to do:**

- Emit `user:typing` on first keystroke in message input
- Debounce: don't re-emit if already typing
- Emit `user:stop_typing` when input cleared or after 3 seconds of no keystrokes
- Show "User is typing..." indicator below messages
- Auto-hide after 3 seconds (use timeout)

---

### 6. Receive Message Edits

**Listen:**

```typescript
socket.on("message:edited", (message) => {
  // Update message in local state
});
```

**Payload:**

```json
{
  "id": 46,
  "roomId": 1,
  "content": "This is my edited message",
  "isEdited": true,
  "updatedAt": "2025-01-20T15:31:00Z"
}
```

**What to do:**

- Update message in local state by ID
- Show "Edited" label
- Re-render message with new content

---

### 7. Receive Message Deletes

**Listen:**

```typescript
socket.on("message:deleted", (message) => {
  // Remove/hide message from UI
});
```

**Payload:**

```json
{
  "id": 46,
  "roomId": 1,
  "isDeleted": true
}
```

**What to do:**

- Remove message from local state OR set `isDeleted: true`
- Hide from UI (or show "Message deleted")

---

### 8. Member Join/Leave Events

**Listen for user joining room:**

```typescript
socket.on("member:joined", ({ memberId, userId, userName, roomId }) => {
  // Update members list, show notification
});
```

**Listen for user leaving room:**

```typescript
socket.on("member:left", ({ memberId, userId, userName, roomId }) => {
  // Remove from members list, show notification
});
```

**What to do:**

- Update members list in room (add/remove)
- Show system message "Ahmed joined the chat"
- Update online status indicator (optional)

---

### 9. Leave Room (When user closes chat)

**Emit:**

```typescript
socket.emit("leave_room", roomId);
```

**What to do:**

- Call when user navigates away from room
- This removes user from Socket.IO room
- Broadcasts `member:left` event to others
- Clean up any timers/intervals for this room

---

## Part 5: Frontend State Management

### Local State Structure (per component or store):

```typescript
// Chat rooms list
rooms: {
  id: number;
  name: string;
  unreadCount: number;
  lastMessage: Message | null;
  members: Member[];
  isMuted: boolean;
}[]

// Active room messages
messages: {
  id: number;
  roomId: number;
  senderId: number;
  senderName: string;
  content: string;
  type: 'TEXT' | 'FILE';
  fileUrl?: string;
  createdAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  readBy?: ReadReceipt[];
}[]

// Typing indicators per room
typingUsers: {
  [roomId]: {
    userId: number;
    userName: string;
    typingSince: number;  // timestamp
  }[]
}

// Active members in room
activeMembers: Member[]
```

---

## Part 6: Implementation Checklist

### Phase 1: Setup

- [ ] Initialize Socket.IO client with userId query param
- [ ] Create Socket context/provider
- [ ] Handle connect/disconnect events
- [ ] Store socket instance globally

### Phase 2: Rooms List

- [ ] Fetch rooms on app load: `GET /shared/chat/rooms?page=0&limit=25`
- [ ] Display rooms with unreadCount badge
- [ ] Display lastMessage preview
- [ ] Implement pagination (load more on scroll)
- [ ] Call `POST /shared/chat/read-all` on room focus

### Phase 3: Chat Window

- [ ] Fetch messages on room open: `GET /shared/chat/rooms/:roomId/messages?page=0&limit=50`
- [ ] Emit `join_room(roomId)` Socket.IO event
- [ ] Emit `message:mark_read(roomId)` Socket.IO event
- [ ] Listen to `message:created` and add to list
- [ ] Implement message input form
- [ ] POST message: `POST /shared/chat/rooms/:roomId/messages`
- [ ] Handle message send errors

### Phase 4: Real-time Features

- [ ] Listen to `message:edited` and update local state
- [ ] Listen to `message:deleted` and remove from UI
- [ ] Listen to `member:joined` and update members list
- [ ] Listen to `member:left` and update members list
- [ ] Implement typing indicators (`user:typing` / `user:stop_typing`)

### Phase 5: Advanced Features

- [ ] Edit message: `PUT /shared/chat/messages/:messageId`
- [ ] Delete message: `DELETE /shared/chat/messages/:messageId`
- [ ] File uploads in message POST
- [ ] Scroll-up pagination for older messages
- [ ] Message reactions (if backend ready)
- [ ] Read receipts ("Seen by...")

---

## Part 7: Error Handling

### API Errors (HTTP):

- **400 Bad Request**: Invalid payload | Show user error message
- **401 Unauthorized**: Not authenticated | Redirect to login
- **403 Forbidden**: Not member of room | Show "Access denied"
- **404 Not Found**: Room/message doesn't exist | Show "Not found"
- **500 Server Error**: Backend error | Show "Something went wrong, try again"

### Socket.IO Errors:

- **Disconnection**: Show offline indicator, auto-reconnect via Socket.IO config
- **Event emission fails**: Log error, don't crash UI
- **Timeout**: Treat as disconnection, wait for reconnect

### Network Resilience:

- Implement optimistic updates (add message to UI before API confirms)
- Queue failed messages and retry on reconnect
- Show connection status indicator (online/offline/connecting)

---

## Part 8: Performance Tips

1. **Message Pagination**: Don't load all 1000 messages at once, use pagination
2. **Typing Debounce**: Throttle `user:typing` emits (not every keystroke)
3. **Virtual Scrolling**: If rooms list is large, use virtualization
4. **Unread Badges**: Calculate client-side, update on `message:created`
5. **Socket Rooms**: Backend namespaces by room ID, so you only receive messages for joined rooms
6. **Cleanup**: Unsubscribe from Socket events on component unmount to prevent memory leaks

---

## Summary of Event Flow

### User Opens Chat App:

1. Socket connects with userId
2. Fetch rooms: `GET /shared/chat/rooms`
3. Display rooms list with unread counts

### User Selects a Room:

1. Fetch messages: `GET /shared/chat/rooms/:roomId/messages`
2. Emit: `socket.emit('join_room', roomId)`
3. Emit: `socket.emit('message:mark_read', roomId)`
4. Listen to: `message:created`, `message:edited`, `message:deleted`, `member:joined/left`, `user:typing`
5. Display messages, members, typing indicators

### User Sends a Message:

1. POST: `POST /shared/chat/rooms/:roomId/messages` with content
2. Optimistic update: add to local messages immediately
3. Listen for `message:created` event (real-time broadcast)
4. All users in room receive event and see message

### User Closes/Minimizes Room:

1. Emit: `socket.emit('leave_room', roomId)`
2. Stop listening to room-specific events
3. Room automatically updated in rooms list on next fetch

---

## Questions/Support

- API base: `http://localhost:3000`
- All authenticated endpoints require JWT token in cookie or header
- Socket.IO namespacing: room IDs are auto-joined via `join_room` event
- For file uploads: use FormData with multipart/form-data
- Timestamps are ISO 8601 format (use `.toLocaleString()` for display)
