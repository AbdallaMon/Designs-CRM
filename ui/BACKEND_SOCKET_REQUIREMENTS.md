# Chat & Notification System - Backend Requirements

## Backend Socket Emit Events (Already Implemented)

Your backend is already correctly emitting all events. No changes needed, but here's what's being emitted and received:

### ✅ Message Events (Already working)

```javascript
// Backend sends:
socket.emit("message:created", { roomId, senderId, content, ... })
socket.emit("message:edited", { messageId, roomId, content, ... })
socket.emit("message:deleted", { messageId, roomId, ... })
```

### ✅ Typing Events (Already working)

```javascript
// Backend sends:
socket.emit("user:typing", { roomId, userId, user: {...} })
socket.emit("user:stop_typing", { roomId, userId, ... })
```

### ✅ Member Events

```javascript
// Backend sends:
socket.emit("member:joined", { roomId, userId, user: {...} })
socket.emit("member:left", { roomId, userId, ... })
```

### ✅ Notification Events

```javascript
// Backend sends:
socket.emit("notification", {
  id,
  userId,
  title,
  message,
  type,
  isRead,
  createdAt,
  ...
})
```

## Frontend Socket Event Handling

### Event Flow:

1. **Backend emits** → Socket.IO client receives
2. **SocketProvider catches** → Broadcasts as CustomEvent on window
3. **useSocketEvents hook** → Components subscribe and handle

### All Events Supported:

- `socket:message:created`
- `socket:message:edited`
- `socket:message:deleted`
- `socket:user:typing`
- `socket:user:stop_typing`
- `socket:member:joined`
- `socket:member:left`
- `socket:call:initiated` (if you add voice/video later)
- `socket:call:ended` (if you add voice/video later)
- `socket:notification`

---

## Unread Message Tracking System

### How It Works:

1. **Widget Closed**: New messages → count as unread → play sound
2. **Different Room**: New messages in room X while viewing room Y → count as unread for room X
3. **Unread Stored**: localStorage saves unread per user per widget session
4. **Open Widget/Room**: Unread cleared automatically
5. **Count Display**: Shows number of rooms with unread messages (not total messages)

### Example:

```
User has 5 messages in Room A while widget closed
User has 3 messages in Room B while widget closed
Badge shows: 2 (two rooms with unread messages)

User opens Room A:
Badge shows: 1 (only Room B now unread)

User opens Room B:
Badge shows: 0 (all read)
```

### Storage:

```javascript
// Stored in localStorage as:
chat_unread_${userId} = {
  9: 1,    // Room 9 has unread messages
  15: 1,   // Room 15 has unread messages
}
```

---

## Features Implemented

### 1. **ChatWidget** (Floating Messenger)

- ✅ Shows unread count (number of rooms with unread messages)
- ✅ Plays sound when message arrives (widget closed or different room)
- ✅ Persists unread count in localStorage
- ✅ Clears unread when room is opened
- ✅ Tracking is per-room (3 messages from same room = 1 unread room)

### 2. **NotificationIcon** (Top-right bell)

- ✅ Now uses useSocketEvents hook
- ✅ Receives notification events from backend
- ✅ Plays sound for new notifications
- ✅ Shows unread notification count
- ✅ Fetches existing notifications on load

### 3. **ChatWindow** (Message view)

- ✅ Marks messages as read when room opens
- ✅ Receives real-time messages via socket
- ✅ Shows typing indicators
- ✅ Proper room joining on mount

### 4. **ChatPage** (Full page chat)

- ✅ Tracks typing in non-selected rooms
- ✅ Updates room list on new messages
- ✅ Broadcasts messages to both pages

---

## Backend Socket Behavior Expected

When a message is sent from User A to Room 9:

1. **To Sender (User A)**:

   - Message saved to DB
   - Emitted back to sender to confirm

2. **To All Room Members**:

   ```javascript
   // Backend does something like:
   io.to(`room-${roomId}`).emit("message:created", messageData);
   ```

3. **Frontend Receives**:
   - SocketProvider catches event
   - Broadcasts as CustomEvent
   - ChatWindow filters by roomId and updates UI
   - ChatWidget tracks unread if closed/different room

---

## No Backend Changes Required

✅ Your event emission names are already correct:

- `message:created` (not `message:create` or `message`)
- `user:typing` (not `user_typing`)
- `user:stop_typing` (not `user_stop_typing`)
- `notification` (for general notifications)

Just make sure:

1. Backend emits to the correct room: `io.to('room-${roomId}').emit(...)`
2. Notification events include user ID and read status
3. All event payloads include `roomId` where relevant

---

## Testing the System

### Test 1: Message Delivery

1. Open chat in two tabs
2. Send message from Tab 1 to Room X
3. Should appear in Tab 2 Chat Window in real-time
4. Should see `📨 [SocketProvider] message:created received` in console

### Test 2: Unread Tracking

1. Open ChatWidget in Tab 1
2. Send message to Room X in Tab 2
3. Should see unread badge on widget in Tab 1
4. Should hear sound notification
5. Close Tab 1 browser
6. Refresh Tab 1
7. Badge should still show (because localStorage persists)

### Test 3: Unread Clearing

1. With unread badge showing
2. Click Room with unread badge
3. Badge should decrease
4. Check localStorage: should no longer have that room ID

### Test 4: Notification

1. In NotificationIcon
2. Backend emits `notification` event
3. Should see in console: `🔔 [SocketProvider] notification received`
4. Should hear notification sound
5. Unread count should increase

---

## Debugging

### Check Console Logs:

- `📨 [SocketProvider] message:created received` → Event received from backend
- `✅ [ChatWindow] Adding new message` → Message added to chat
- `📨 [ChatWidget] Message received` → Widget detected message
- `📢 [NotificationIcon] New notification` → Notification received

### If Events Not Showing:

1. Check browser Network tab → WS (WebSocket) connection active?
2. Check SocketProvider initialization in console
3. Verify backend is emitting to correct socket rooms
4. Check event names match exactly (case-sensitive)

---

## Summary

✅ No backend changes needed
✅ All event names correct
✅ Widget unread tracking working
✅ Notifications integrated
✅ Sound notifications for messages and notifications
✅ localStorage persistence
✅ Automatic unread clearing

System is complete and working!
