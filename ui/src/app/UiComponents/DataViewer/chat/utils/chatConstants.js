// Chat system constants

export const CHAT_ROOM_TYPES = {
  STAFF_TO_STAFF: "STAFF_TO_STAFF",
  PROJECT_GROUP: "PROJECT_GROUP",
  CLIENT_TO_STAFF: "CLIENT_TO_STAFF",
  MULTI_PROJECT: "MULTI_PROJECT",
  GROUP: "GROUP",
};

export const CHAT_MESSAGE_TYPES = {
  TEXT: "TEXT",
  FILE: "FILE",
  IMAGE: "IMAGE",
  VOICE: "VOICE",
  VIDEO: "VIDEO",
  SYSTEM: "SYSTEM",
};

export const CHAT_MEMBER_ROLES = {
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  MEMBER: "MEMBER",
};

export const CALL_TYPES = {
  AUDIO: "AUDIO",
  VIDEO: "VIDEO",
};

export const CALL_STATUSES = {
  RINGING: "RINGING",
  ONGOING: "ONGOING",
  ENDED: "ENDED",
  MISSED: "MISSED",
  CANCELLED: "CANCELLED",
};

export const SCHEDULED_MESSAGE_STATUSES = {
  PENDING: "PENDING",
  SENT: "SENT",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
};

export const CHAT_ROOM_TYPE_LABELS = {
  STAFF_TO_STAFF: "Staff to Staff",
  PROJECT_GROUP: "Project Group",
  CLIENT_TO_STAFF: "Client to Staff",
  MULTI_PROJECT: "Multi-Project",
};

export const CHAT_CATEGORIES = [
  { value: "DIRECT", label: "Direct Messages" },
  { value: "PROJECT", label: "Project Chats" },
  { value: "CLIENT", label: "Client Leads" },
  { value: "GROUP", label: "Group Chats" },
  { value: "ARCHIVED", label: "Archived" },
];

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 50000 * 1024 * 1024, // 50 GB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};
