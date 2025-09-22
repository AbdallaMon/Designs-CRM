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
  InputAdornment,
} from "@mui/material";
import { BsLink, BsTelegram } from "react-icons/bs";
import { MdEdit, MdSave, MdCancel } from "react-icons/md";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAuth } from "@/app/providers/AuthProvider";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel";

const TelegramLink = ({ lead, setLead, setleads }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempLink, setTempLink] = useState(lead?.telegramLink || "");
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const { setLoading } = useToastContext();

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
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
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
  const isValidLink = lead?.telegramLink && lead.telegramLink.trim();

  if (isEditing) {
    return (
      <Box sx={{ width: "450px" }}>
        <Box
          display="flex"
          alignItems="flex-start"
          gap={1}
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "action.hover",
            border: "2px solid",
            borderColor: "primary.light",
          }}
        >
          <TextField
            size="small"
            value={tempLink}
            onChange={(e) => setTempLink(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter Telegram link"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <BsTelegram size={18} color="#1976d2" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
          />
          <Box display="flex" gap={0.5}>
            <Tooltip title="Save (Enter)">
              <span>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  startIcon={<MdSave />}
                  sx={{ minWidth: "80px" }}
                >
                  {"Save"}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Cancel (Esc)">
              <Button
                variant="outlined"
                size="small"
                onClick={handleCancel}
                startIcon={<MdCancel />}
              >
                Cancel
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      mx={1}
      sx={{
        gap: 1,
        "&:hover": {
          "& .edit-button": {
            visibility: isAdmin ? "visible" : "hidden",
          },
          "& .copy-button": {
            visibility: isValidLink ? "visible" : "hidden",
          },
          bgcolor: "action.hover",
          borderRadius: 1,
          transition: "all 0.2s ease",
        },
        p: 1,
        borderRadius: 1,
      }}
    >
      {isValidLink ? (
        <>
          <Box display="flex" alignItems="center" flex={1} gap={1}>
            <Tooltip title={`Open ${displayText} in Telegram`}>
              <Chip
                icon={<BsTelegram size={16} />}
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2" component="span">
                      {displayText}
                    </Typography>
                    <BsLink size={12} />
                  </Box>
                }
                component={"a"}
                href={lead.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                variant="outlined"
                sx={{
                  color: "primary.main",
                  borderColor: "primary.main",
                  textDecoration: "none",
                  "& .MuiChip-icon": {
                    color: "primary.main",
                  },
                  "&:hover": {
                    bgcolor: "primary.light",
                    color: "primary.contrastText",
                    "& .MuiChip-icon": {
                      color: "primary.contrastText",
                    },
                  },
                  transition: "all 0.2s ease",
                  fontWeight: 500,
                  maxWidth: "200px",
                }}
              />
            </Tooltip>
            <CreateNewTeleGramGroup
              isAdmin={isAdmin}
              lead={lead}
              setLead={setLead}
              setleads={setleads}
            />
            <AddUserToAChannel isAdmin={isAdmin} lead={lead} />
          </Box>
        </>
      ) : (
        <Box display="flex" alignItems="center" width="100%">
          <Chip
            icon={<BsTelegram size={16} />}
            label="No Telegram link"
            variant="outlined"
            sx={{
              color: "text.secondary",
              borderColor: "divider",
              "& .MuiChip-icon": {
                color: "text.secondary",
              },
            }}
          />
          <CreateNewTeleGramGroup
            isAdmin={isAdmin}
            lead={lead}
            setLead={setLead}
            setleads={setleads}
          />
        </Box>
      )}
    </Box>
  );
};
function CreateNewTeleGramGroup({ isAdmin, lead, setLead, setleads }) {
  const { setLoading } = useToastContext();
  async function createNewGroup() {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `admin/client-leads/${lead.id}/telegram/new`,
      false,
      "Creating"
    );
    if (req.status === 200) {
      if (setLead) {
        setLead((old) => ({ ...old, telegramLink: req.data }));
      }
      if (setleads) {
        setleads((oldLeads) => {
          return oldLeads.map((l) => {
            if (l.id === lead.id) {
              return { ...l, telegramLink: req.data };
            }
            return l;
          });
        });
      }
    }
    return req;
  }
  return (
    <>
      {isAdmin && (
        <Tooltip title="Create new telegram group">
          <ConfirmWithActionModel
            title="Create new telegram group"
            description="By confirming we will create new telegram group and remove the current from the system"
            removeAfterConfirm={true}
            handleConfirm={createNewGroup}
            label={"New Channel"}
          />
        </Tooltip>
      )}
    </>
  );
}
export function AddUserToAChannel({ isAdmin, lead }) {
  const { setLoading } = useToastContext();
  async function createNewGroup() {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `admin/client-leads/${lead.id}/telegram/assign-users`,
      false,
      "Adding"
    );

    return req;
  }
  return (
    <>
      {isAdmin && (
        <Tooltip title="Add users to the channel">
          <ConfirmWithActionModel
            title="Add users to the channel"
            description="By confirming we will all users related to the project with a valid username to the channel"
            removeAfterConfirm={true}
            handleConfirm={createNewGroup}
            label={"Add staff"}
          />
        </Tooltip>
      )}
    </>
  );
}
export default TelegramLink;
