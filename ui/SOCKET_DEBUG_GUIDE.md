# Socket Message Receiving - Debug Guide

## 🔴 Problem Found

Your frontend had **multiple issues** preventing message reception:

### Issue 1: ChatWidget Not Using Hook Callbacks

**Problem**: `useSocketIO()` was called without any callbacks

```javascript
// ❌ OLD - This doesn't set up listeners!
const { socket } = useSocketIO();
```

**Fix**: Pass callbacks to hook so it sets up listeners

```javascript
// ✅ NEW - This properly sets up listeners
const { socket } = useSocketIO(null, {
  onNewMessage: (data) => {
    /* handle */
  },
  onTyping: (data) => {
    /* handle */
  },
  onStopTyping: (data) => {
    /* handle */
  },
});
```

### Issue 2: Manual Socket Listener Conflicts

**Problem**: Code was manually calling `socket?.on()` instead of using the hook's built-in listeners, causing duplicate/conflicting handlers.

**Fix**: Removed manual listeners and let the hook handle it (cleaner, better cleanup).

### Issue 3: Event Name Mismatch (Most Likely Cause!)

**Problem**: Code listens to `"message:created"` but backend might emit different name:

- Backend could emit: `"message:new"`, `"message"`, `"messages"`, etc.

**Fix**: Added universal event logging to show ALL events being received.

---

## 🔍 How to Debug Now

### Step 1: Check Browser Console

Open **DevTools → Console** and look for:

```
✅ Socket.IO connected: [socket-id]
📨 [Socket Event] "message:created": [data]
📨 [Socket Event] "user:typing": [data]
```

### Step 2: Find Actual Event Names

The `📨 [Socket Event]` messages show **EXACTLY** what your backend is emitting.

Look for patterns like:

- `message:created` ✅ Already listening
- `message:new` ⚠️ Need to update listener
- `new:message` ⚠️ Need to update listener
- Something else ⚠️ Need to update listener

### Step 3: If Backend Uses Different Event Names

If your backend uses `"message:new"` instead of `"message:created"`:

**Update useSocketIO.js** (message events section):

```javascript
socket.on("message:new", handleNewMessage); // ← Change this
socket.on("message:edited", handleMessageEdited);
socket.on("message:deleted", handleMessageDeleted);
```

---

## 📋 Changes Made to Your Code

### 1. **ChatWidget.jsx**

- ✅ Changed from `useSocketIO()` to `useSocketIO(null, { callbacks })`
- ✅ Removed manual `socket.on()` listeners
- ✅ Let hook handle all event setup
- ✅ Added console.log in onNewMessage callback

### 2. **ChatPage.jsx**

- ✅ Added proper `useSocketIO()` hook with callbacks
- ✅ Removed manual socket listeners
- ✅ Removed commented-out code that was causing confusion

### 3. **socketIO.js**

- ✅ Added `socket.onAny()` to log ALL incoming events
- ✅ Better console logging with emojis
- ✅ Shows event names and data

### 4. **SocketProvider.jsx**

- ✅ Added event logging hook to track listener setup

---

## ✅ Verification Checklist

- [ ] Open browser DevTools → Console
- [ ] See `✅ Socket.IO connected: [id]`
- [ ] Send a message from another user/tab
- [ ] Look for `📨 [Socket Event] "message..."` in console
- [ ] Note the exact event name
- [ ] Message should appear in chat (if event name matches)
- [ ] See `console.log("Message received in widget:", data)` output

---

## 🎯 If Still Not Working

1. **Check backend is emitting**: Send message, watch console for any `📨 [Socket Event]` lines
   - If NOTHING appears → Backend not emitting OR wrong socket namespace
2. **Check exact event name**: Copy the event name from console
   - Update `useSocketIO.js` line that says `socket.on("message:created", ...)`
3. **Check room join**: Verify `join_room` is working
   - Look for console logs showing room join success
4. **Check socket connection**:
   - Should see `✅ Socket.IO connected:` in console
   - If not → Check `NEXT_PUBLIC_URL` env variable

---

## 🔧 Quick Fix Template

If backend uses different event name, update `useSocketIO.js`:

```javascript
// Lines ~87-95 in useSocketIO.js
useEffect(() => {
  if (!socket) return;

  const handleNewMessage = (data) => {
    console.log(data, "new message added");
    onNewMessage?.(data);
  };

  // CHANGE THIS LINE based on what you see in console:
  socket.on("message:created", handleNewMessage);  // ← Change event name here

  // ... rest of code
```

---

## 📞 Status After Fix

✅ **Chat messages should now receive**  
✅ **Typing indicators should show**  
✅ **Both sender and receiver see updates**  
✅ **Sound notifications should play**

If still having issues, share the exact event names you see in the `📨 [Socket Event]` console logs!
