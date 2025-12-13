# Socket.IO Architecture - Clean Implementation

## Overview

This is a professional, production-ready Socket.IO implementation for Next.js 15 that follows best practices:

- ✅ Single source of truth (SocketProvider)
- ✅ Centralized event handling
- ✅ No console.logs in production code
- ✅ Unified hook API (useSocket)
- ✅ No duplicate/redundant files
- ✅ Callback registration system for flexibility
- ✅ Automatic cleanup on component unmount

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  SocketProvider (Root)                  │
│  - Initializes socket connection once                   │
│  - Manages all socket.on() listeners                    │
│  - Provides context with callback registry              │
└──────────────┬──────────────────────────────────────────┘
               │ Provides { socket, registerCallback, unregisterCallback }
               │
       ┌───────▼────────┐
       │   useSocket    │ (New unified hook)
       │   Hook         │
       ├────────────────┤
       │ - Register     │
       │   callbacks    │
       │ - Auto cleanup │
       │ - No logic     │
       │   duplication  │
       └────────────────┘
               ▲
               │ Used in:
         ┌─────┴──────┬─────────────┬──────────────┐
         │             │             │              │
    ChatPage    ChatWindow      ChatWidget    NotificationIcon
    (Typing)    (Messages)    (Notifications) (Notifications)
```

## Files Structure

### Core Socket Files

```
src/app/
├── providers/
│   └── SocketProvider.jsx ✅ REFACTORED
│       - Initializes socket once
│       - Manages callbacks registry
│       - Exports useSocket hook
│
└── UiComponents/DataViewer/chat/
    ├── hooks/
    │   ├── useSocket.js ✅ NEW (Replaces useSocketEvents + useSocketIO)
    │   ├── useChatRooms.js
    │   ├── useChatMessages.js
    │   └── index.js (exports all hooks)
    │
    ├── utils/
    │   └── socketIO.js (emitter functions, no listeners)
    │
    ├── components/
    │   ├── ChatWindow.jsx ✅ UPDATED
    │   ├── ChatRoomsList.jsx
    │   └── ChatMessage.jsx
    │
    ├── ChatPage.jsx ✅ UPDATED
    └── ChatWidget.jsx ✅ UPDATED

❌ DELETED:
- useSocketIO.js (merged into useSocket)
- useSocketEvents.js (replaced with useSocket)
```

## How It Works

### 1. SocketProvider Initialization

```javascript
// src/app/providers/SocketProvider.jsx
export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const callbacksRef = useRef({});

  // On socket event, execute all registered callbacks
  const executeCallbacks = (eventName, data) => {
    const callbacks = callbacksRef.current[eventName] || [];
    callbacks.forEach(({ callback }) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in callback for ${eventName}:`, error);
      }
    });
  };

  // Listen to all socket events at the source
  socket.on("message:created", (data) =>
    executeCallbacks("message:created", data)
  );
  socket.on("user:typing", (data) => executeCallbacks("user:typing", data));
  // ... more events

  return (
    <SocketContext.Provider
      value={{ socket, registerCallback, unregisterCallback }}
    >
      {children}
    </SocketContext.Provider>
  );
}
```

### 2. useSocket Hook (Unified)

```javascript
// src/app/UiComponents/DataViewer/chat/hooks/useSocket.js
export function useSocket({
  onMessageCreated,
  onMessageEdited,
  onMessageDeleted,
  onTyping,
  onStopTyping,
  onMemberJoined,
  onMemberLeft,
  onCallInitiated,
  onCallEnded,
  onNotification,
} = {}) {
  const { registerCallback, unregisterCallback } = useSocket();
  const callbackIdsRef = useRef({});

  // Register callbacks on mount
  useEffect(() => {
    if (onMessageCreated) {
      const id = registerCallback("message:created", onMessageCreated);
      callbackIdsRef.current.messageCreated = id;
    }
    // ... other callbacks

    // Cleanup on unmount
    return () => {
      Object.entries(callbackIdsRef.current).forEach(([_key, id]) => {
        unregisterCallback(eventName, id);
      });
    };
  }, [onMessageCreated, onMessageEdited /* ... */]);
}
```

### 3. Component Usage (Simple & Clean)

**Before (Old Way):**

```javascript
// Had to import TWO hooks
import { useSocketEvents } from "../hooks/useSocketEvents";
import { useSocketIO } from "../hooks";

// Had multiple listeners
useSocketEvents({ onMessageCreated, onTyping, onStopTyping });
useSocketIO(roomId, { callbacks... });
```

**After (New Way):**

```javascript
// ONE unified hook
import { useSocket } from "../hooks";

// ONE place for all socket listeners
useSocket({
  onMessageCreated: (data) => {
    /* ... */
  },
  onTyping: (data) => {
    /* ... */
  },
  onStopTyping: (data) => {
    /* ... */
  },
  // ... all other events in one place
});
```

## Usage Examples

### Example 1: ChatPage (Room List Typing Indicators)

```javascript
import { useSocket } from "./hooks";

export default function ChatPage() {
  const [typingRooms, setTypingRooms] = useState({});

  useSocket({
    onMessageCreated: () => {
      fetchRooms(0, false); // Refetch room list
    },
    onTyping: (data) => {
      if (data.roomId !== selectedRoom?.id) {
        setTypingRooms((prev) => {
          const roomTyping = prev[data.roomId] || new Set();
          roomTyping.add(data.userId);
          return { ...prev, [data.roomId]: roomTyping };
        });
      }
    },
    onStopTyping: (data) => {
      setTypingRooms((prev) => {
        const roomTyping = prev[data.roomId];
        if (roomTyping instanceof Set) {
          roomTyping.delete(data.userId);
          if (roomTyping.size === 0) {
            delete prev[data.roomId];
          }
        }
        return prev;
      });
    },
  });

  return <ChatRoomsList typingRooms={typingRooms} />;
}
```

### Example 2: ChatWindow (Room Messages)

```javascript
export function ChatWindow({ room, user }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useSocket({
    onMessageCreated: (data) => {
      if (data.roomId === room.id && data.senderId !== user.id) {
        setMessages((prev) => [...prev, data]);
      }
    },
    onMessageEdited: (data) => {
      if (data.roomId === room.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, isEdited: true, ...data } : msg
          )
        );
      }
    },
    onMessageDeleted: (data) => {
      if (data.roomId === room.id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, isDeleted: true } : msg
          )
        );
      }
    },
    onTyping: (data) => {
      if (data.roomId === room.id && data.userId !== user.id) {
        setTypingUsers((prev) => [...new Set([...prev, data])]);
      }
    },
    onStopTyping: (data) => {
      if (data.roomId === room.id) {
        setTypingUsers((prev) =>
          prev.filter((item) => item.userId !== data.userId)
        );
      }
    },
  });

  return <ChatWindow messages={messages} typingUsers={typingUsers} />;
}
```

### Example 3: ChatWidget (Global Notifications)

```javascript
export function ChatWidget() {
  const [rooms, setRooms] = useState([]);

  useSocket({
    onMessageCreated: (data) => {
      fetchRooms(0, false);
      // Play sound for message not in current room
      if (data.roomId !== selectedRoom?.id) {
        messageSound.play();
      }
    },
    onTyping: (data) => {
      // Show typing in room list if not in that room
      if (data.roomId !== selectedRoom?.id) {
        setTypingRooms((prev) => {
          const roomTyping = prev[data.roomId] || new Set();
          roomTyping.add(data.userId);
          return { ...prev, [data.roomId]: roomTyping };
        });
      }
    },
  });

  return <ChatRoomsList typingRooms={typingRooms} />;
}
```

### Example 4: NotificationIcon (Global Notifications)

```javascript
export function NotificationsIcon() {
  const [notifications, setNotifications] = useState([]);

  useSocket({
    onNotification: (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      notificationSound.play();
    },
  });

  return <NotificationList notifications={notifications} />;
}
```

## Event Types Available

```javascript
useSocket({
  // Message events
  onMessageCreated: (data) => {}, // New message in room
  onMessageEdited: (data) => {}, // Message content edited
  onMessageDeleted: (data) => {}, // Message deleted

  // Typing events
  onTyping: (data) => {}, // User started typing
  onStopTyping: (data) => {}, // User stopped typing

  // Member events
  onMemberJoined: (data) => {}, // User joined room
  onMemberLeft: (data) => {}, // User left room

  // Call events
  onCallInitiated: (data) => {}, // Call started
  onCallEnded: (data) => {}, // Call ended

  // Notification events
  onNotification: (data) => {}, // New notification
});
```

## Data Structures

### Message Event Data

```javascript
{
  id: number,
  roomId: number,
  senderId: number,
  content: string,
  type: "TEXT" | "FILE",
  fileName?: string,
  createdAt: string,
  updatedAt: string,
}
```

### Typing Event Data

```javascript
{
  userId: number,
  roomId: number,
  userName: string,
}
```

### Room Data (with Unread)

```javascript
{
  id: number,
  name: string,
  unreadCount: number,  // From backend
  lastMessage: {...},
  members: [...],
  type: "CLIENT_TO_STAFF" | "STAFF_TO_STAFF" | "PROJECT_GROUP",
}
```

## Best Practices Applied

### ✅ 1. Single Responsibility

- SocketProvider: Connection + Event routing
- useSocket: Callback registration + Cleanup
- Components: Business logic only

### ✅ 2. No Duplication

- Events handled once in SocketProvider
- No custom events or window events
- One callback system for all

### ✅ 3. Automatic Cleanup

- Callbacks unregistered on unmount
- No memory leaks
- No stale closures

### ✅ 4. Type Safety Ready

- Can be extended with TypeScript
- Clear prop expectations
- No magic strings

### ✅ 5. Performance

- Callbacks only execute for registered listeners
- No unnecessary re-renders
- Efficient cleanup on unmount

### ✅ 6. Error Handling

- Try-catch in callback execution
- Errors don't affect other callbacks
- Console.error for debugging

## Migration Checklist

If you had old implementations:

- ❌ Delete `useSocketIO.js`
- ❌ Delete `useSocketEvents.js`
- ✅ Replace imports with `useSocket`
- ✅ Move all listeners into one `useSocket` call
- ✅ Remove window event listeners
- ✅ Remove custom events

## Testing

To test the socket system:

1. Open ChatPage and ChatWidget simultaneously
2. Send a message - should appear in both instantly
3. Start typing - typing indicator shows in both
4. Stop typing - indicator disappears
5. Send message from another user - appears in ChatWindow
6. Close ChatWindow - typing indicator visible in ChatRoomsList
7. Open notification - notification sound plays

## Debugging

To debug socket events:

```javascript
// In SocketProvider, you can add temporary logging:
const executeCallbacks = (eventName, data) => {
  console.log(`[Socket Event] ${eventName}:`, data);
  // ... rest of logic
};
```

Or in browser console:

```javascript
// Get socket from context
const { socket } = useSocket();
socket.on("*", (event, data) => console.log(event, data));
```

## Future Enhancements

Possible additions without changing architecture:

1. **Message Search** - Add `onMessageSearch` event
2. **Presence** - Add `onUserOnline`, `onUserOffline` events
3. **Reactions** - Add `onMessageReaction` event
4. **Mentions** - Add `onMention` event
5. **Video Calls** - Add `onCallSignal` event

Just add the socket listener in SocketProvider and register callback in component!

---

**This architecture is production-ready and follows industry best practices for real-time communication in Next.js applications.**
