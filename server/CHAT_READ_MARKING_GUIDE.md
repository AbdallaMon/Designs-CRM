# Chat Message Read Marking - Frontend Implementation

## Quick Overview

Implement message read tracking so the system knows when users read messages in real-time.

---

## Option 1: Simple (Recommended for Quick Setup)

### When user opens/focuses a room:

**Emit once on room open:**

```typescript
socket.emit("message:mark_read", roomId);
```

This marks ALL previous unread messages in that room as read.

**Backend response:**

- Updates `ChatMember.lastReadAt` to current timestamp
- Next API call to `GET /shared/chat/rooms` will show `unreadCount: 0` for this room
- Broadcasts `message:read` event to other users in the room

---

## Option 2: Per-Message (Advanced)

### When you receive a new message while in the room:

**Listen for incoming message:**

```typescript
socket.on("message:created", (message) => {
  // Add to UI
  addMessageToList(message);

  // Mark it as read immediately
  socket.emit("message:mark_read", roomId, message.id);
});
```

**Backend response:**

- Creates ChatReadReceipt linking message + current user
- Broadcasts `message:read` event with `{ messageId, memberId, readAt }`
- Other users can show "You read this at 3:30 PM"

---

## Option 3: Hybrid (Best UX)

### Combine both approaches:

1. **On room open:** `socket.emit('message:mark_read', roomId);` → marks room as read
2. **On incoming message:** `socket.emit('message:mark_read', roomId, message.id);` → per-message receipt

---

## Implementation Steps

### Step 1: Add listener for incoming messages (if not already done)

```typescript
socket.on("message:created", (message) => {
  setMessages((prev) => [...prev, message]);

  // Mark as read immediately
  socket.emit("message:mark_read", roomId, message.id);
});
```

### Step 2: Emit on room open/focus

```typescript
// When user selects a room
useEffect(() => {
  if (selectedRoomId) {
    socket.emit("join_room", selectedRoomId);
    socket.emit("message:mark_read", selectedRoomId); // ← Add this
  }
}, [selectedRoomId]);
```

### Step 3: Emit on window focus (optional but good)

```typescript
useEffect(() => {
  const handleFocus = () => {
    if (selectedRoomId) {
      socket.emit("message:mark_read", selectedRoomId);
    }
  };

  window.addEventListener("focus", handleFocus);
  return () => window.removeEventListener("focus", handleFocus);
}, [selectedRoomId]);
```

---

## What to expect after implementation

### In GET /shared/chat/rooms:

- `unreadCount` will be 0 for rooms you've read
- Previously showed 3 unread, now shows 0

### Via Socket.IO:

- Backend broadcasts `message:read` event to other users
- You might listen to it to show "User read this" indicators:

```typescript
socket.on("message:read", ({ messageId, memberId, readAt }) => {
  // Show "Ahmed read at 3:30 PM" under message
});
```

### In database:

- `ChatMember.lastReadAt` updated to now
- `ChatReadReceipt` created (if marking specific message)

---

## That's it!

Just add those two Socket.IO emits and you're done. No API calls needed for read marking—it's all real-time via Socket.IO.
