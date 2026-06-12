"use client";

import { Menu, MenuItem } from "@mui/material";
import { FaArchive, FaBell, FaBellSlash, FaTrash } from "react-icons/fa";
import { CHAT_ROOM_TYPES } from "../../config/chatConstants.js";

/**
 * Room context menu. Mute/Archive are personal (always available to a member). Delete
 * is gated on the backend-computed `room.capabilities.canDelete` (×ROOM_DELETE upstream
 * in the list page); Leave is shown when the user cannot delete and it's not a direct chat.
 */
export function RoomActions({
  menuAnchor,
  menuRoomId,
  room,
  handleMenuClose,
  onMuteRoom,
  onArchiveRoom,
  setDeleteConfirm,
  setLeaveConfirm,
  isMuted,
  isArchived,
  canDelete,
}) {
  const isDirect = room?.type === CHAT_ROOM_TYPES.STAFF_TO_STAFF;

  return (
    <Menu
      anchorEl={menuAnchor}
      open={Boolean(menuAnchor && menuRoomId === room.id)}
      onClose={handleMenuClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{ zIndex: 1302 }}
    >
      <MenuItem
        onClick={() => {
          onMuteRoom(room.id, !isMuted);
          handleMenuClose();
        }}
      >
        {isMuted ? (
          <>
            <FaBell size={14} style={{ marginInlineEnd: 8 }} /> إلغاء الكتم
          </>
        ) : (
          <>
            <FaBellSlash size={14} style={{ marginInlineEnd: 8 }} /> كتم
          </>
        )}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onArchiveRoom(room.id, !isArchived);
          handleMenuClose();
        }}
      >
        <FaArchive size={14} style={{ marginInlineEnd: 8 }} />
        {isArchived ? "إلغاء الأرشفة" : "أرشفة"}
      </MenuItem>
      {!isDirect && canDelete && (
        <MenuItem onClick={() => setDeleteConfirm(true)}>
          <FaTrash size={14} style={{ marginInlineEnd: 8 }} /> حذف
        </MenuItem>
      )}
      {!isDirect && !canDelete && (
        <MenuItem onClick={() => setLeaveConfirm(true)}>
          <FaTrash size={14} style={{ marginInlineEnd: 8 }} /> مغادرة
        </MenuItem>
      )}
    </Menu>
  );
}
