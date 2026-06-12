// Chat domain constants — migrated verbatim from the legacy chat feature
// (UiComponents/DataViewer/chat/utils/chatConstants.js) to preserve behavior.

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

export const CHAT_ROOM_TYPE_LABELS = {
  STAFF_TO_STAFF: "محادثة مباشرة",
  PROJECT_GROUP: "مجموعة مشروع",
  CLIENT_TO_STAFF: "عميل محتمل",
  MULTI_PROJECT: "متعدد المشاريع",
  GROUP: "مجموعة",
};

// all types allowed
export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 50000 * 1024 * 1024, // 50 GB
  ALLOWED_TYPES: [
    "image/jpg",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/x-zip-compressed",
    "text/plain",
    "application/zip",
    "application/x-rar-compressed",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "audio/mpeg",
    "audio/wav",
    "audio/webm",
    "audio/ogg",
  ],
};

export const CHAT_LIMITS = {
  FILES: 5,
  MESSAGES: 10,
  rooms: 10,
};

// Room-list filter chips (legacy ChatChips), single-language Arabic.
export const CHAT_FILTER_CHIPS = [
  { label: "الكل", value: "ALL" },
  { label: "غير مقروء", value: "UNREAD" },
  { label: "مؤرشف", value: "ARCHIVED" },
  { label: "مباشر", value: "DIRECT" },
  { label: "مجموعة", value: "GROUP" },
  { label: "مشروع", value: "PROJECT" },
  { label: "عملاء محتملون", value: "CLIENT_LEADS" },
];

export const CHAT_FILTER_CHIPS_TAB = [
  { label: "الكل", value: "ALL" },
  { label: "غير مقروء", value: "UNREAD" },
  { label: "مشروع", value: "PROJECT" },
  { label: "عملاء محتملون", value: "CLIENT_LEADS" },
  { label: "مؤرشف", value: "ARCHIVED" },
];
