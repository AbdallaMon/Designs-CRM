"use client";

import React from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { FaEllipsisV, FaReply, FaTrash, FaShare } from "react-icons/fa";
import { MdPushPin } from "react-icons/md";

export function MessageActions({
  message,
  isPinned,
  canPin,
  canDelete,
  canForward,
  onReply,
  onPin,
  onUnPin,
  onDelete,
  setMenuAnchor,
  menuAnchor,
  selectedMessages,
  handleSelect,
}) {
  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{
          position: "absolute",
          top: 4,
          insetInlineEnd: 4,
          zIndex: 2,
          color: "inherit",
          opacity: 0.55,
          transition: "opacity .2s ease",
          "&:hover": { opacity: 1, bgcolor: "action.hover" },
        }}
      >
        <FaEllipsisV size={14} />
      </IconButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        sx={{
          zIndex: 1305,
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              minWidth: 160,
              boxShadow: 3,
              "& .MuiMenuItem-root": {
                fontSize: "0.85rem",
                gap: 1,
              },
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onReply?.(message);
          }}
        >
          <FaReply /> Reply
        </MenuItem>

        {canPin && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              if (isPinned) {
                onUnPin?.(message);
              } else {
                onPin?.(message);
              }
            }}
          >
            {isPinned ? (
              <>
                <MdPushPin /> Unpin
              </>
            ) : (
              <>
                <MdPushPin /> Pin
              </>
            )}
          </MenuItem>
        )}

        {canDelete && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onDelete?.(message.id);
            }}
            sx={{ color: "error.main" }}
          >
            <FaTrash /> Delete
          </MenuItem>
        )}
        {canForward && !message.isDeleted && (
          <MenuItem onClick={handleSelect}>
            <FaShare />{" "}
            {selectedMessages.some((m) => m.id === message.id)
              ? "Deselect"
              : "Select"}{" "}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
