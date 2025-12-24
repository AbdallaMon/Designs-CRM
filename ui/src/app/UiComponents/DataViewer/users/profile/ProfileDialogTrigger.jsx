"use client";

import React, { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { FaUserCircle } from "react-icons/fa";
import ProfileDialog from "./ProfileDialog";
import { useSearchParams } from "next/navigation";

export default function ProfileDialogTrigger({ userId, iconSize = 22 }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  useState(() => {
    if (searchParams.get("profileOpen") === "true") {
      setOpen(true);
    }
  }, [searchParams]);
  return (
    <>
      <Tooltip title="Profile">
        <span>
          <IconButton
            onClick={() => {
              const newUrl = new URL(window.location);
              // add profile open query parameter
              newUrl.searchParams.set("profileOpen", "true");
              window.history.replaceState({}, "", newUrl);
              setOpen(true);
            }}
            disabled={!userId}
            size="small"
          >
            <FaUserCircle size={iconSize} />
          </IconButton>
        </span>
      </Tooltip>

      <ProfileDialog
        open={open}
        onClose={() => {
          const newUrl = new URL(window.location);
          // remove profile open query parameter
          newUrl.searchParams.delete("profileOpen");
          window.history.replaceState({}, "", newUrl);
          setOpen(false);
        }}
        userId={userId}
      />
    </>
  );
}
