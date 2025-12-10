# Chat System - Required APIs

## Overview

This document outlines all the backend APIs required for the chat system to function. The frontend expects these endpoints to exist with the specified request/response formats.

## Base URL

All endpoints use the base path: `/shared/chat/` or `/shared/` as specified below.

---

## Chat Rooms Endpoints

### 1. Get Chat Rooms

**Endpoint:** `GET /shared/chat/rooms`

**Query Parameters:**

- `category` (optional): `DIRECT`, `PROJECT`, `GROUP`, `ARCHIVED`
- `projectId` (optional): Filter rooms for a specific project
- `clientLeadId` (optional): Filter rooms for a specific client lead
- `page` (optional, default: 0): Pagination page
- `limit` (optional, default: 20): Items per page

**Response:**

```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "type": "STAFF_TO_STAFF",
      "name": "Project Discussion",
      "avatarUrl": "...",
      "projectId": null,
      "clientLeadId": null,
      "isMuted": false,
      "isArchived": false,
      "allowFiles": true,
      "allowCalls": true,
      "isChatEnabled": true,
      "createdById": 1,
      "createdBy": { "id": 1, "name": "Admin", "email": "admin@..." },
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z",
      "members": [
        {
          "id": 1,
          "roomId": 1,
          "userId": 1,
          "user": { "id": 1, "name": "John", "email": "john@..." },
          "clientId": null,
          "role": "ADMIN",
          "isMuted": false,
          "isPinned": false,
          "lastReadAt": "2025-01-01T10:30:00Z",
          "notifyOnReply": true,
          "joinedAt": "2025-01-01T10:00:00Z",
          "leftAt": null
        }
      ]
    }
  ],
  "total": 10,
  "totalPages": 1
}
```

### 2. Create Chat Room

**Endpoint:** `POST /shared/chat/rooms`

**Request Body:**

```json
{
  "name": "Project Discussion",
  "type": "PROJECT_GROUP",
  "projectId": 1,
  "clientLeadId": null,
  "userIds": [1, 2, 3],
  "allowFiles": true,
  "allowCalls": true,
  "isChatEnabled": true
}
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "type": "PROJECT_GROUP",
    "name": "Project Discussion",
    "members": [...]
  }
}
```

### 3. Update Chat Room

**Endpoint:** `PUT /shared/chat/rooms/{roomId}`

**Request Body:**

```json
{
  "name": "Updated Name",
  "isMuted": false,
  "isArchived": false,
  "allowFiles": true,
  "allowCalls": true
}
```

**Response:** Same as Get Chat Rooms item

### 4. Delete Chat Room

**Endpoint:** `DELETE /shared/chat/rooms/{roomId}`

**Response:**

```json
{
  "status": 200,
  "message": "Chat room deleted"
}
```

---

## Messages Endpoints

### 5. Get Messages in Room

**Endpoint:** `GET /shared/chat/rooms/{roomId}/messages`

**Query Parameters:**

- `page` (default: 0)
- `limit` (default: 50)

**Response:**

```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "roomId": 1,
      "type": "TEXT",
      "content": "Hello everyone!",
      "fileUrl": null,
      "fileName": null,
      "fileSize": null,
      "fileMimeType": null,
      "isEdited": false,
      "isDeleted": false,
      "replyToId": null,
      "replyTo": null,
      "forwardedFromId": null,
      "senderId": 1,
      "sender": { "id": 1, "name": "John", "email": "john@..." },
      "senderClient": null,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-01T10:00:00Z"
    }
  ],
  "total": 100,
  "totalPages": 2
}
```

### 6. Send Message

**Endpoint:** `POST /shared/chat/rooms/{roomId}/messages`

**Request:**

- Content-Type: `application/json` OR `multipart/form-data` (if uploading file)

**Request Body (JSON):**

```json
{
  "content": "Hello team!",
  "type": "TEXT",
  "replyToId": null
}
```

**Request Body (Form Data for files):**

```
content: "Check this file"
type: "FILE"
file: [binary file data]
fileName: "document.pdf"
fileMimeType: "application/pdf"
replyToId: null
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "id": 2,
    "roomId": 1,
    "type": "TEXT",
    "content": "Hello team!",
    "senderId": 1,
    "sender": { "id": 1, "name": "John" },
    "createdAt": "2025-01-01T10:01:00Z"
  }
}
```

### 7. Edit Message

**Endpoint:** `PUT /shared/chat/messages/{messageId}`

**Request Body:**

```json
{
  "content": "Updated content"
}
```

**Response:** Same as Send Message

### 8. Delete Message

**Endpoint:** `DELETE /shared/chat/messages/{messageId}`

**Response:**

```json
{
  "status": 200,
  "message": "Message deleted"
}
```

---

## Members Endpoints

### 9. Add Members to Room

**Endpoint:** `POST /shared/chat/rooms/{roomId}/members`

**Request Body:**

```json
{
  "userIds": [1, 2, 3]
}
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "members": [...]
  }
}
```

### 10. Remove Member from Room

**Endpoint:** `DELETE /shared/chat/rooms/{roomId}/members/{memberId}`

**Response:**

```json
{
  "status": 200,
  "message": "Member removed"
}
```

### 11. Update Member Role

**Endpoint:** `PUT /shared/chat/rooms/{roomId}/members/{memberId}`

**Request Body:**

```json
{
  "role": "MODERATOR"
}
```

**Response:**

```json
{
  "status": 200,
  "data": {
    "id": 1,
    "roomId": 1,
    "userId": 1,
    "role": "MODERATOR"
  }
}
```

---

## Search Endpoints

### 12. Search Users (for adding to chat)

**Endpoint:** `GET /admin/all-users`

**Query Parameters:**

- `role` (optional): `STAFF`, `ADMIN`, etc.
- `projectId` (optional): Return only users related to project
- `page` (optional)
- `limit` (optional)

**Response:**

```json
{
  "status": 200,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "STAFF",
      "avatar": "..."
    }
  ]
}
```

---

## Authorization & Permissions

### Rules:

1. **ADMIN/SUPER_ADMIN:**

   - Can create/delete/edit any chat room
   - Can add/remove any members
   - Can see all messages in rooms they're part of
   - Can mute/archive/delete any chat

2. **STAFF (Normal):**

   - Can create STAFF_TO_STAFF chats only
   - Can only message in rooms they're members of
   - Can only see messages for rooms they're in
   - Cannot add members to project chats (only admins can)

3. **CLIENT:**
   - Can only message in CLIENT_TO_STAFF rooms
   - Can see messages only in their assigned rooms
   - Cannot create new chats
   - Cannot add members

---

## Error Responses

**400 Bad Request:**

```json
{
  "status": 400,
  "message": "Invalid room type"
}
```

**403 Forbidden:**

```json
{
  "status": 403,
  "message": "You don't have permission to perform this action"
}
```

**404 Not Found:**

```json
{
  "status": 404,
  "message": "Chat room not found"
}
```

**500 Internal Server Error:**

```json
{
  "status": 500,
  "message": "Internal server error"
}
```

---

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `403`: Forbidden
- `404`: Not Found
- `500`: Server Error

---

## File Upload Limits

- Maximum file size: 50MB
- Allowed types: PDF, Word documents, Excel sheets, Images (JPG, PNG, GIF)

---

## Real-time Features (Optional but Recommended)

Consider implementing WebSocket support for:

- Live message updates
- Typing indicators
- User online/offline status
- Read receipts
- Call notifications

Suggested events:

- `chat:message:new`
- `chat:message:edited`
- `chat:message:deleted`
- `chat:user:typing`
- `chat:user:online`
- `chat:call:initiated`
