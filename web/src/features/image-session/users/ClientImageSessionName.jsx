"use client";
import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  ClickAwayListener,
  TextField,
} from "@mui/material";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";
import { USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";

function ClientImageSessionName({
  name = "",
  onSave = async (newName) => {}, // pass a function that persists the name
  minWidth = 160,
  maxWidth = 360,
  sessionId,
  clientLeadId,
}) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name || "");
  const originalRef = useRef(name || "");
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const showEdit = hovered && !editing;

  const startEdit = () => {
    setEditing(true);
    setHovered(false);
    setValue(originalRef.current);
  };

  const cancelEdit = () => {
    setEditing(false);
    setValue(originalRef.current);
  };

  const handleSave = async () => {
    if (!value.trim()) {
      setAlertError(FEEDBACK.NAME_CANNOT_BE_EMPTY);
      return;
    }
    const trimmed = value.trim();

    if (trimmed === originalRef.current.trim()) {
      setAlertError(FEEDBACK.NO_CHANGES_MADE);
      return;
    }
    const req = await handleRequestSubmit(
      { name: trimmed },
      setLoading,
      `image-session/${clientLeadId}/sessions/${sessionId}`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      await onSave(trimmed);
      originalRef.current = trimmed;
      setEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <ClickAwayListener
      onClickAway={() => {
        setHovered(false);
        if (!editing) setEditing(false);
      }}
    >
      <Box
        onMouseEnter={() => !editing && setHovered(true)}
        onMouseLeave={() => !editing && setHovered(false)}
        onFocus={() => !editing && setHovered(true)}
        onBlur={() => !editing && setHovered(false)}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          minWidth,
          maxWidth,
          px: 1,
          py: 0.5,
          borderRadius: 1.5,
          transition: "background-color 120ms ease",
          bgcolor: showEdit || editing ? "action.hover" : "transparent",
        }}
      >
        {!editing ? (
          <>
            <Typography
              variant="body1"
              noWrap
              title={originalRef.current || "no name"}
              sx={{ flex: 1, cursor: "default" }}
              onClick={() => setHovered(true)}
            >
              {originalRef.current ? originalRef.current : "no name"}
            </Typography>

            {showEdit && (
              <IconButton
                size="small"
                onClick={startEdit}
                aria-label="Edit name"
                sx={{ ml: 0.5 }}
              >
                <FiEdit2 />
              </IconButton>
            )}
          </>
        ) : (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <TextField
              size="small"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter name"
              fullWidth
            />
            <IconButton
              color="primary"
              onClick={handleSave}
              aria-label="Save"
              disabled={value.trim() === originalRef.current.trim()}
            >
              <FiCheck />
            </IconButton>
            <IconButton onClick={cancelEdit} aria-label="Cancel">
              <FiX />
            </IconButton>
          </Stack>
        )}
      </Box>
    </ClickAwayListener>
  );
}

export default ClientImageSessionName;
