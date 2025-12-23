"use client";

import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { FaUserCircle } from "react-icons/fa";
import ProfileDialog from "./ProfileDialog";

export default function ProfileDialogTrigger({ userId, iconSize = 22 }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Profile">
        <span>
          <IconButton
            onClick={() => setOpen(true)}
            disabled={!userId}
            size="small"
          >
            <FaUserCircle size={iconSize} />
          </IconButton>
        </span>
      </Tooltip>

      <ProfileDialog
        open={open}
        onClose={() => setOpen(false)}
        userId={userId}
      />
    </>
  );
}
