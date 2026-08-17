// Compatibility exports for existing chat imports; the values are canonical in
// the workspace shared package.
export {
  CHAT_CALL_STATUSES as CALL_STATUSES,
  CHAT_CALL_TYPES as CALL_TYPES,
  CHAT_MEMBER_ROLES,
  CHAT_MESSAGE_TYPES,
  CHAT_ROOM_FILTERS,
  CHAT_ROOM_TYPES,
  SCHEDULED_MESSAGE_STATUSES,
} from "@dms/shared";
import { CHAT_ROOM_FILTERS } from "@dms/shared";

export const CHAT_ROOM_TYPE_LABELS = {
  STAFF_TO_STAFF: "Direct",
  PROJECT_GROUP: "Project Group",
  CLIENT_TO_STAFF: "Client lead",
  STAFF_GROUP: "Multi-Project",
  GROUP: "Group",
};

export const CHAT_CATEGORIES = [
  { value: CHAT_ROOM_FILTERS.DIRECT, label: "Direct Messages" },
  { value: CHAT_ROOM_FILTERS.PROJECT, label: "Project Chats" },
  { value: CHAT_ROOM_FILTERS.CLIENT_LEADS, label: "Client Leads" },
  { value: CHAT_ROOM_FILTERS.GROUP, label: "Group Chats" },
  { value: CHAT_ROOM_FILTERS.ARCHIVED, label: "Archived" },
];
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
  ],
};

export const CHAT_LIMITS = {
  FILES: 5,
  MESSAGES: 10,
  rooms: 10,
};
