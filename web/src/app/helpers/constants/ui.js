import React from "react";
import colors from "../colors";
import {
  AiOutlineEdit,
  AiOutlineFileText,
  AiOutlineUserAdd,
} from "react-icons/ai";
import { BiNote, BiTransfer } from "react-icons/bi";
import { MdAttachMoney, MdCall } from "react-icons/md";
import {
  FaFileArchive,
  FaFileAudio,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileUpload,
  FaFileVideo,
  FaFileWord,
} from "react-icons/fa";

// Severity ramp (neutral → severe), derived from the warm brand palette so the
// priority chips read as part of the same product, not a stray Material rainbow.
export const priorityColors = {
  VERY_LOW: { bg: colors.bgTertiary, color: colors.textTertiary, border: colors.border },
  LOW: { bg: colors.primaryAlt, color: colors.infoDark, border: colors.infoLight },
  MEDIUM: { bg: colors.secondaryAlt, color: colors.secondaryDark, border: colors.accent },
  HIGH: { bg: colors.surfaceElevated, color: colors.primaryDark, border: colors.primary },
  VERY_HIGH: { bg: "#f7ece9", color: colors.errorDark, border: colors.error },
};

export const taskStatusColors = {
  TODO: { bg: colors.secondaryAlt, color: colors.secondaryDark, border: colors.accent },
  IN_PROGRESS: { bg: colors.primaryAlt, color: colors.infoDark, border: colors.info },
  DONE: { bg: "#eef2ea", color: colors.successDark, border: colors.success },
};

export const groupColors = {
  0: { bg: "#f8fbff", border: "#2196f3", text: "#1565c0" },
  1: { bg: "#faf8ff", border: "#9c27b0", text: "#7b1fa2" },
  2: { bg: "#f9fcf9", border: "#4caf50", text: "#2e7d32" },
  3: { bg: "#fffcf7", border: "#ff9800", text: "#f57c00" },
  4: { bg: "#fef7f9", border: "#e91e63", text: "#c2185b" },
  5: { bg: "#f7fcfc", border: "#26a69a", text: "#00695c" },
  6: { bg: "#fffef5", border: "#ffeb3b", text: "#f9a825" },
  7: { bg: "#f9fdf9", border: "#8bc34a", text: "#689f38" },
  8: { bg: "#fcfcfc", border: "#607d8b", text: "#455a64" },
  9: { bg: "#f9faff", border: "#5c6bc0", text: "#3f51b5" },
};
// One semantic status map, derived from the warm caramel brand palette
// (colors.js). Keys are the English enum values / project-status labels used
// everywhere in logic — only the hues changed, so no call site breaks. Deduped
// (the old map repeated IN_PROGRESS/REJECTED/Delivery) and completed (added the
// "Rejected" project label that was previously missing → undefined border).
export const statusColors = {
  // Lead pipeline
  NEW: colors.info,
  IN_PROGRESS: colors.info,
  INTERESTED: colors.success,
  NEEDS_IDENTIFIED: colors.accent,
  NEGOTIATING: colors.secondary,
  LEADEXCHANGE: colors.textTertiary,
  REJECTED: colors.error,
  FINALIZED: colors.successDark,
  ARCHIVED: colors.textMuted,

  // Deal / work-stage (enum-style)
  CLIENT_COMMUNICATION: colors.info,
  DESIGN_STAGE: colors.secondary,
  THREE_D_STAGE: colors.primary,
  THREE_D_APPROVAL: colors.success,
  DRAWING_PLAN: colors.infoDark,
  FINAL_DELIVERY: colors.successDark,
  FIRST_MODIFICATION: colors.accent,
  SECOND_MODIFICATION: colors.secondaryDark,
  THIRD_MODIFICATION: colors.primaryDark,
  PROGRESS: colors.info,
  PRICING: colors.secondary,
  ACCEPTED: colors.success,
  QUANTITY: colors.accent,

  // Payment levels — warm ramp, light → dark
  LEVEL_1: colors.primaryLight,
  LEVEL_2: colors.accent,
  LEVEL_3: colors.primary,
  LEVEL_4: colors.secondary,
  LEVEL_5: colors.secondaryDark,
  LEVEL_6: colors.primaryDark,
  LEVEL_7_OR_MORE: colors.errorDark,

  // Priority ramp (neutral → severe)
  VERY_LOW: colors.textMuted,
  LOW: colors.info,
  MEDIUM: colors.accent,
  HIGH: colors.secondaryDark,
  VERY_HIGH: colors.error,

  // Task status
  TODO: colors.accent,
  DONE: colors.success,

  // Project work-stage labels (string keys)
  "To Do": colors.accent,
  "3D": colors.primary,
  Render: colors.secondary,
  Delivery: colors.successDark,
  Hold: colors.textTertiary,
  Completed: colors.success,
  Modification: colors.primaryDark,
  Rejected: colors.error,
  Studying: colors.info,
  Electricity: colors.infoDark,
  Started: colors.secondary,
  "In Progress": colors.info,
};

export const initialPageLimit = 10;
export const totalLimitPages = [10, 20, 50, 100];
export const simpleModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxHeight: "90%",
  overflow: "auto",
  width: {
    xs: "95%",
    sm: "80%",
    md: "60%",
  },
  maxWidth: {
    md: "600px",
  },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
};

export const notificationIcons = {
  NEW_LEAD: <AiOutlineUserAdd size={24} />,
  LEAD_ASSIGNED: <AiOutlineUserAdd size={24} />,
  LEAD_STATUS_CHANGED: <AiOutlineFileText size={24} />,
  LEAD_TRANSFERRED: <BiTransfer size={24} />,
  LEAD_UPDATED: <AiOutlineEdit size={24} />,
  LEAD_CONTACT: <MdAttachMoney size={24} />,
  NOTE_ADDED: <BiNote size={24} />,
  NEW_NOTE: <BiNote size={24} />,
  NEW_FILE: <FaFileUpload size={24} />,
  CALL_REMINDER_CREATED: <MdCall size={24} />,
  CALL_REMINDER_STATUS: <MdCall size={24} />,
  PRICE_OFFER_SUBMITTED: <MdAttachMoney size={24} />,
  PRICE_OFFER_UPDATED: <MdAttachMoney size={24} />,
  FINAL_PRICE_ADDED: <MdAttachMoney size={24} />,
  FINAL_PRICE_CHANGED: <MdAttachMoney size={24} />,
  OTHER: <AiOutlineFileText size={24} />,
};

export const FILE_TYPE_CONFIG = {
  "application/pdf": { icon: FaFilePdf, color: "#D32F2F", label: "PDF" },
  "image/jpeg": { icon: FaFileImage, color: "#1976D2", label: "Image" },
  "image/png": { icon: FaFileImage, color: "#1976D2", label: "Image" },
  "image/gif": { icon: FaFileImage, color: "#1976D2", label: "Image" },
  "image/webp": { icon: FaFileImage, color: "#1976D2", label: "Image" },
  "video/mp4": { icon: FaFileVideo, color: "#7B1FA2", label: "Video" },
  "video/webm": { icon: FaFileVideo, color: "#7B1FA2", label: "Video" },
  "video/quicktime": { icon: FaFileVideo, color: "#7B1FA2", label: "Video" },
  "audio/mpeg": { icon: FaFileAudio, color: "#F57C00", label: "Audio" },
  "audio/wav": { icon: FaFileAudio, color: "#F57C00", label: "Audio" },
  "audio/ogg": { icon: FaFileAudio, color: "#F57C00", label: "Audio" },
  "application/msword": { icon: FaFileWord, color: "#2196F3", label: "Word" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    icon: FaFileWord,
    color: "#2196F3",
    label: "Word",
  },
  "application/vnd.ms-excel": {
    icon: FaFileExcel,
    color: "#388E3C",
    label: "Excel",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    icon: FaFileExcel,
    color: "#388E3C",
    label: "Excel",
  },
  "application/zip": { icon: FaFileArchive, color: "#616161", label: "ZIP" },
  "application/x-rar-compressed": {
    icon: FaFileArchive,
    color: "#616161",
    label: "RAR",
  },
};

export const FILE_TYPE_CATEGORIES = [
  { value: "image", label: "Images", icon: FaFileImage },
  { value: "video", label: "Videos", icon: FaFileVideo },
  { value: "audio", label: "Audio", icon: FaFileAudio },
  { value: "document", label: "Docs", icon: FaFileWord },
];
