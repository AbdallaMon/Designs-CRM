"use client";
import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import { BsTelegram } from "react-icons/bs";
import { MdEdit, MdSave, MdCancel } from "react-icons/md";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAuth } from "@/app/providers/AuthProvider";

const TelegramLink = ({ lead, setLead, setleads }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLink, setTempLink] = useState(lead?.telegramLink || "");
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const { setLoading } = useToastContext();

  // Early return if user is STAFF
  if (user.role === "STAFF") return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await handleRequestSubmit(
        {
          telegramLink: tempLink,
        },
        setLoading,
        `admin/leads/update/${lead.id}`,
        false,
        "Updating"
      );

      await fetch("/api/updateLead", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegramLink: tempLink,
        }),
      });

      if (response.status === 200) {
        if (setleads) {
          setleads((prev) =>
            prev.map((l) =>
              l.id === lead.id
                ? {
                    ...l,
                    telegramLink: tempLink,
                  }
                : l
            )
          );
        }
        if (setLead) {
          setLead({ ...lead, telegramLink: tempLink });
        }
        setIsEditing(false);
      } else {
        console.error("Failed to update Telegram link");
      }
    } catch (error) {
      console.error("Error updating Telegram link:", error);
    }
  };

  const handleCancel = () => {
    setTempLink(lead?.telegramLink || "");
    setIsEditing(false);
  };

  // Format the link for display - extract username if possible
  const formatTelegramLink = (link) => {
    if (!link) return "";
    try {
      // Extract username from link if possible
      const url = new URL(link);
      if (url.hostname === "t.me") {
        return "@" + url.pathname.substring(1);
      }
      return link;
    } catch {
      return link;
    }
  };

  const displayText = formatTelegramLink(lead?.telegramLink);

  if (isEditing) {
    return (
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: "rgba(0, 125, 255, 0.05)",
          border: "1px solid rgba(0, 125, 255, 0.2)",
        }}
      >
        <TextField
          size="small"
          value={tempLink}
          onChange={(e) => setTempLink(e.target.value)}
          placeholder="Enter Telegram link (e.g., https://t.me/username)"
          fullWidth
          InputProps={{
            startAdornment: (
              <Box component="span" sx={{ mr: 1, color: "#0088cc" }}>
                <BsTelegram size={18} />
              </Box>
            ),
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSave}
          startIcon={<MdSave />}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleCancel}
          startIcon={<MdCancel />}
        >
          Cancel
        </Button>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      sx={{
        "&:hover": {
          "& .edit-button": {
            visibility: isAdmin ? "visible" : "hidden",
          },
          bgcolor: isAdmin ? "rgba(0, 125, 255, 0.05)" : "transparent",
          borderRadius: 1,
          transition: "background-color 0.2s ease",
        },
        p: 0.5,
      }}
    >
      {lead?.telegramLink ? (
        <>
          <Box display="flex" alignItems="center" width="100%">
            <Tooltip title="Open in Telegram">
              <Chip
                icon={<BsTelegram size={16} style={{ color: "#0088cc" }} />}
                label={displayText}
                component="a"
                href={lead.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                sx={{
                  color: "#0088cc",
                  borderColor: "#0088cc",
                  "& .MuiChip-icon": {
                    color: "#0088cc",
                  },
                  "&:hover": {
                    bgcolor: "rgba(0, 136, 204, 0.1)",
                  },
                  transition: "all 0.2s ease",
                  fontWeight: 500,
                }}
                variant="outlined"
              />
            </Tooltip>
          </Box>
          {isAdmin && (
            <Tooltip title="Edit Telegram link">
              <IconButton
                size="small"
                className="edit-button"
                onClick={handleEdit}
                sx={{ visibility: "hidden", ml: 1, color: "#0088cc" }}
              >
                <MdEdit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ) : (
        <Box display="flex" alignItems="center">
          <Chip
            icon={<BsTelegram size={16} style={{ color: "#9e9e9e" }} />}
            label="Telegram link not set"
            variant="outlined"
            sx={{
              color: "text.secondary",
              borderColor: "rgba(0, 0, 0, 0.23)",
            }}
          />
          {isAdmin && (
            <Tooltip title="Add Telegram link">
              <IconButton
                size="small"
                className="edit-button"
                onClick={handleEdit}
                sx={{ visibility: "hidden", ml: 1, color: "#0088cc" }}
              >
                <MdEdit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TelegramLink;
