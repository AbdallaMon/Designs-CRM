# Socket Event System - Architecture Update

## 🎯 Problem Solved

The issue was that socket listeners were being attached **after** the socket was already connected, causing them to miss events. The solution is to set up all listeners **at the source** (SocketProvider) and broadcast events using CustomEvents.

## ✅ What Changed

### 1. **SocketProvider.jsx** (Primary Change)

- ✅ Socket listeners are now set up **immediately when socket is initialized**
- ✅ All events are broadcast as CustomEvents on `window`:
  - `socket:message:created`
  - `socket:message:edited`
  - `socket:message:deleted`
  - `socket:user:typing`
  - `socket:user:stop_typing`
  - `socket:member:joined`
  - `socket:member:left`
  - `socket:call:initiated`
  - `socket:call:ended`
- ✅ Socket is stored in `socketRef` to prevent re-initialization
- ✅ Console logs show all events with emojis for debugging

### 2. **useSocketEvents.js** (New Hook)

- ✅ Custom hook that listens to CustomEvents dispatched from SocketProvider
- ✅ Avoids timing issues completely
- ✅ Cleaner API: `useSocketEvents({ onMessageCreated, onTyping, ... })`
- ✅ Automatic cleanup of event listeners

### 3. **ChatWindow.jsx** (Updated)

- ✅ Replaced `useSocketIO` with `useSocketEvents`
- ✅ Now properly joins room on mount: `joinChatRoom(room.id, user)`
- ✅ Listens to events and only processes for current room
- ✅ Filters messages by `roomId` to avoid cross-room contamination

### 4. **ChatPage.jsx** (Updated)

- ✅ Replaced `useSocketIO` with `useSocketEvents`
- ✅ Tracks typing users in non-selected rooms
- ✅ Refetches room list on new messages

### 5. **ChatWidget.jsx** (Updated)

- ✅ Replaced `useSocketIO` with `useSocketEvents`
- ✅ Plays message sound for out-of-room notifications
- ✅ Tracks typing indicators

## 🔄 Event Flow

```
Backend emits "message:created"
        ↓
Socket.IO client receives it
        ↓
SocketProvider.jsx handles it
        ↓
Dispatches CustomEvent "socket:message:created" on window
        ↓
useSocketEvents hook catches it
        ↓
Component's onMessageCreated callback fires
```

## 🐛 Why This Works Better

| Issue                 | Old Approach                                       | New Approach                              |
| --------------------- | -------------------------------------------------- | ----------------------------------------- |
| **Listener Timing**   | Listeners attached after socket might be connected | Listeners set up at socket initialization |
| **Event Loss**        | Events could be missed if listeners not ready      | All events caught at source               |
| **Code Organization** | Scattered across components                        | Centralized in SocketProvider             |
| **Debugging**         | Hard to track when listeners attached              | Clear logs show all setup at one place    |
| **Room Filtering**    | No consistent room filtering                       | Components filter by roomId               |

## 📝 How to Use

### In a Component:

```javascript
import { useSocketEvents } from "@/app/UiComponents/DataViewer/chat/hooks/useSocketEvents";

function MyComponent() {
  useSocketEvents({
    onMessageCreated: (data) => {
      console.log("New message:", data);
    },
    onTyping: (data) => {
      console.log("User typing:", data);
    },
    onStopTyping: (data) => {
      console.log("User stopped typing:", data);
    },
  });
}
```

## ✨ Console Output

You should now see:

```
📨 [SocketProvider] message:created received: {message data}
✅ [ChatWindow] Adding new message from socket: {message data}
📨 [ChatPage] New message received: {message data}
```

## 🔧 If You Need to Add More Events

1. Add listener in **SocketProvider.jsx**:

```javascript
newSocket.on("some:event", (data) => {
  window.dispatchEvent(new CustomEvent("socket:some:event", { detail: data }));
});
```

2. Add handler in **useSocketEvents.js**:

```javascript
export function useSocketEvents({
  // ... existing callbacks
  onSomeEvent,
} = {}) {
  useEffect(() => {
    const handler = (e) => onSomeEvent?.(e.detail);
    window.addEventListener("socket:some:event", handler);
    return () => window.removeEventListener("socket:some:event", handler);
  }, [onSomeEvent]);
}
```

3. Use in component:

```javascript
useSocketEvents({
  onSomeEvent: (data) => {
    /* handle */
  },
});
```

## ✅ Status

✅ All socket events now working  
✅ Messages received in real-time  
✅ Typing indicators working  
✅ Multi-room support with proper filtering  
✅ Better debugging with comprehensive console logs
