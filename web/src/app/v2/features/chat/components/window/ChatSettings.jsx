"use client";

import { useEffect, useState } from "react";
import {
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
import { MdSettings } from "react-icons/md";
import chatService from "../../chat.service.js";
import { runChatMutation } from "../../chat.mutations.js";

const ADMIN_SETTINGS = [
  { name: "السماح بمشاركة الملفات", type: "checkbox", key: "allowFiles" },
  { name: "تفعيل المحادثة", type: "checkbox", key: "isChatEnabled" },
  { name: "السماح بالاجتماعات", type: "checkbox", key: "allowMeetings" },
  { name: "السماح بالمكالمات", type: "checkbox", key: "allowCalls" },
];
const NAME_SETTINGS = [{ name: "اسم المجموعة", type: "text", key: "name" }];

/**
 * Room settings. Visible only when the backend says the user can edit this room
 * (`room.capabilities.canEdit`). Saves via update-room-settings (ROOM_EDIT upstream).
 */
export function ChatSettings({ room, reFetchRooms, fetchChatRoom }) {
  const [open, setOpen] = useState(false);
  const canEdit = Boolean(room?.capabilities?.canEdit);
  if (!canEdit || room?.type === "STAFF_TO_STAFF") return null;

  const settings = [...ADMIN_SETTINGS, ...NAME_SETTINGS];

  return (
    <>
      <IconButton aria-label="settings" title="إعدادات المحادثة" onClick={() => setOpen(true)}>
        <MdSettings size={20} />
      </IconButton>
      {open && (
        <ChatSettingsModal
          handleClose={() => setOpen(false)}
          room={room}
          settings={settings}
          reFetchRooms={reFetchRooms}
          fetchChatRoom={fetchChatRoom}
        />
      )}
    </>
  );
}

function ChatSettingsModal({ handleClose, room, settings, reFetchRooms, fetchChatRoom }) {
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initial = {};
    settings.forEach((s) => { initial[s.key] = room?.[s.key] ?? (s.type === "checkbox" ? false : ""); });
    setFormValues(initial);
  }, [room]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveSettings() {
    const res = await runChatMutation(
      () => chatService.updateRoomSettings(room.id, formValues),
      { loading: "جاري حفظ الإعدادات...", setLoading },
    );
    if (res) {
      fetchChatRoom?.();
      if (room?.name !== formValues.name) reFetchRooms?.();
      handleClose();
    }
  }

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth sx={{ zIndex: 1302 }}>
      <DialogTitle>إعدادات المحادثة</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          {settings.map((setting) => (
            <Box key={setting.key} sx={{ mb: 2 }}>
              {setting.type === "checkbox" ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formValues[setting.key])}
                      onChange={(e) => setFormValues((p) => ({ ...p, [setting.key]: e.target.checked }))}
                    />
                  }
                  label={setting.name}
                />
              ) : (
                <TextField
                  label={setting.name}
                  value={formValues[setting.key] || ""}
                  onChange={(e) => setFormValues((p) => ({ ...p, [setting.key]: e.target.value }))}
                  fullWidth
                />
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error" disabled={loading}>إلغاء</Button>
        <Button onClick={saveSettings} variant="contained" disabled={loading}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChatSettings;
