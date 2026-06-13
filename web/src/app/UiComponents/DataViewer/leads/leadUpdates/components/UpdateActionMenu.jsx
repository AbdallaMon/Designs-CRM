import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import { MdNote } from "react-icons/md";
import { MarkAsDoneModal } from "./MarkAsDoneModal";

/**
 * UpdateActionMenu Component
 * Dropdown menu for update actions (notes, mark as done)
 */
export function UpdateActionMenu({
  menuAnchorEl,
  handleMenuClose,
  handleOpenNotes,
  adminSharedUpdate,
  userSharedUpdate,
  isArchived,
  onToggleArchive,
  update,
  onUpdate,
  canManageDepartments,
}) {
  return (
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          minWidth: 160,
        },
      }}
    >
      <MenuItem onClick={handleOpenNotes}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          <MdNote fontSize="small" />
        </ListItemIcon>
        <ListItemText primary="Manage notes" />
      </MenuItem>

      {((adminSharedUpdate && !isArchived) ||
        (!canManageDepartments && !isArchived)) && (
        <MarkAsDoneModal
          handleMenuClose={handleMenuClose}
          isArchived={isArchived}
          onToggleArchive={onToggleArchive}
          sharedUpdate={
            adminSharedUpdate ? adminSharedUpdate : userSharedUpdate
          }
          update={update}
          onUpdate={onUpdate}
        />
      )}
    </Menu>
  );
}
