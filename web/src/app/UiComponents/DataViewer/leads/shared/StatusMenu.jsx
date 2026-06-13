"use client";
import { Box, Menu, MenuItem } from "@mui/material";
import { statusColors } from "@/app/helpers/constants";

/**
 * StatusMenu component for changing lead status
 * @param {Object} props
 * @param {boolean} props.open - Menu open state
 * @param {HTMLElement} props.anchorEl - Anchor element for menu positioning
 * @param {Function} props.onClose - Close handler
 * @param {Array} props.statuses - Array of status objects with {id, name}
 * @param {Function} props.onStatusChange - Handler for status change
 * @param {Object} props.theme - MUI theme object
 */
export const StatusMenu = ({
  open,
  anchorEl,
  onClose,
  statuses,
  onStatusChange,
  theme,
}) => {
  return (
    <Menu
      id="status-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          mt: 1,
          borderRadius: 2,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
      }}
    >
      {statuses.map((status) => (
        <MenuItem
          key={status.id}
          onClick={() => onStatusChange(status.id)}
          sx={{
            py: 1,
            px: 2,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor:
                statusColors[status.id] || theme.palette.primary.main,
              mr: 1.5,
            }}
          />
          {status.name}
        </MenuItem>
      ))}
    </Menu>
  );
};
