"use client";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import UploadImageWithAvatarPreview from "@/app/UiComponents/formComponents/UploadImageWithAvatarPreview";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdSettings } from "react-icons/md";

const AdminSettings = [
  {
    name: "Allow file sharing",
    type: "checkbox",
    key: "allowFiles",
  },
  {
    name: "Enable chat",
    type: "checkbox",
    key: "isChatEnabled",
  },
  {
    name: "Allow meetings",
    type: "checkbox",
    key: "allowMeetings",
  },
  {
    name: "Allow calls",
    type: "checkbox",
    key: "allowCalls",
  },
];
const sharedGroupSettings = [
  {
    name: "Change group name",
    type: "text",
    key: "name",
  },
  {
    name: "Change group icon",
    type: "file",
    key: "avatarUrl",
  },
];
export default function ChatSettings({ members, room, reFetchRooms }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const currentMember = members?.find((m) => m.user.id === user.id);
  const isAdmin =
    checkIfAdmin(user) ||
    room?.createdBy?.id === user.id ||
    currentMember?.role === "MODERATOR";
  const isGroupMangedByAdmin = checkIfAdmin(room?.createdBy);

  const settings = isAdmin
    ? [...AdminSettings, ...sharedGroupSettings]
    : sharedGroupSettings;

  function handleOpen() {
    setOpen(true);
  }
  function handleClose() {
    setOpen(false);
  }
  if ((isGroupMangedByAdmin && !isAdmin) || room.type === "STAFF_TO_STAFF") {
    return null;
  }

  return (
    <>
      <IconButton
        aria-label="settings"
        title="Chat Settings"
        onClick={handleOpen}
      >
        <MdSettings size={20} />
      </IconButton>
      <ChatSettingsModal
        open={open}
        handleClose={handleClose}
        room={room}
        settings={settings}
        isAdmin={isAdmin}
        reFetchRooms={reFetchRooms}
      />
    </>
  );
}
function ChatSettingsModal({
  open,
  handleClose,
  room,
  settings,
  isAdmin,
  reFetchRooms,
}) {
  const [formValues, setFormValues] = useState({});
  const { loading, setLoading } = useToastContext();
  async function saveSettings() {
    const req = await handleRequestSubmit(
      {
        ...formValues,
      },
      setLoading,
      `shared/chat/rooms/${room.id}`,
      false,
      "Saving chat settings",
      false,
      "PUT"
    );
    if (req?.status === 200) {
      reFetchRooms();
      handleClose();
    }
  }
  useEffect(() => {
    const initialValues = {};
    settings.forEach((setting) => {
      initialValues[setting.key] = room[setting.key] || "";
    });
    setFormValues(initialValues);
  }, [room, settings]);
  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>Chat Settings</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 2 }}>
            {settings.map((setting) => (
              <Box key={setting.key} sx={{ mb: 2 }}>
                <SettingInput
                  setting={setting}
                  value={formValues[setting.key]}
                  onChange={(key, value) => {
                    setFormValues({ ...formValues, [key]: value });
                  }}
                  isAdmin={isAdmin}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="error" disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={saveSettings}
            color="primary"
            disabled={loading}
            variant="contained"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function SettingInput({ setting, value, onChange, isAdmin }) {
  if (setting.type === "checkbox") {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={value || false}
            onChange={(e) => onChange(setting.key, e.target.checked)}
          />
        }
        label={setting.name}
      />
    );
  } else if (setting.type === "text") {
    return (
      <TextField
        label={setting.name}
        value={value || ""}
        onChange={(e) => onChange(setting.key, e.target.value)}
        fullWidth
        margin="normal"
      />
    );
  } else if (setting.type === "file") {
    return (
      <UploadImageWithAvatarPreview
        value={value}
        onChange={onChange}
        keyId={setting.key}
        label={setting.name}
      />
    );
  }
}
