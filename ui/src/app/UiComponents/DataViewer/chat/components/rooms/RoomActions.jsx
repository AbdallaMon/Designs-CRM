import { Menu, MenuItem } from "@mui/material";
import { CHAT_ROOM_TYPES } from "../../utils";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

export function RoomActions({
  menuAnchor,
  menuRoomId,
  room,
  handleMenuClose,
  onMuteRoom,
  onArchiveRoom,
  setDeleteConfirm,
  setLeaveConfirm,
}) {
  const { user, isLoggedIn } = useAuth();
  const isOwner = room?.createdBy?.id === user.id;
  const isGroupManagedByAdmin = checkIfAdmin(room?.createdBy);
  return (
    <Menu
      anchorEl={menuAnchor}
      open={Boolean(menuAnchor && menuRoomId === room.id)}
      onClose={handleMenuClose}
    >
      <MenuItem
        onClick={() => {
          onMuteRoom(room.id);
          handleMenuClose();
        }}
      >
        {room?.isMuted ? (
          <>
            <FaBell size={14} style={{ marginRight: 8 }} />
            Unmute
          </>
        ) : (
          <>
            <FaBellSlash size={14} style={{ marginRight: 8 }} />
            Mute
          </>
        )}
      </MenuItem>
      <MenuItem
        onClick={() => {
          onArchiveRoom(menuRoomId);
          handleMenuClose();
        }}
      >
        <FaArchive size={14} style={{ marginRight: 8 }} />
        {room?.isArchived ? "Unarchive" : "Archive"}
      </MenuItem>
      {room.type !== CHAT_ROOM_TYPES.STAFF_TO_STAFF && isOwner && (
        <MenuItem
          onClick={() => {
            setDeleteConfirm(true);
          }}
        >
          <FaTrash size={14} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      )}
      {!isOwner && !isGroupManagedByAdmin && (
        <MenuItem
          onClick={() => {
            setLeaveConfirm(true);
          }}
        >
          <FaTrash size={14} style={{ marginRight: 8 }} />
          Leave
        </MenuItem>
      )}
    </Menu>
  );
}
