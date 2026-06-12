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
import { useT } from "@/app/v2/lib/i18n";

// `labelKey` resolves the localized label via t() at render; `nameFallback` is the Arabic
// default. `key` is the language-neutral payload field name (logic — do NOT translate).
const ADMIN_SETTINGS = [
  { nameFallback: "السماح بمشاركة الملفات", labelKey: "chat.settings.allowFiles", type: "checkbox", key: "allowFiles" },
  { nameFallback: "تفعيل المحادثة", labelKey: "chat.settings.isChatEnabled", type: "checkbox", key: "isChatEnabled" },
  { nameFallback: "السماح بالاجتماعات", labelKey: "chat.settings.allowMeetings", type: "checkbox", key: "allowMeetings" },
  { nameFallback: "السماح بالمكالمات", labelKey: "chat.settings.allowCalls", type: "checkbox", key: "allowCalls" },
];
const NAME_SETTINGS = [{ nameFallback: "اسم المجموعة", labelKey: "chat.settings.name", type: "text", key: "name" }];

/**
 * Room settings. Visible only when the backend says the user can edit this room
 * (`room.capabilities.canEdit`). Saves via update-room-settings (ROOM_EDIT upstream).
 */
export function ChatSettings({ room, reFetchRooms, fetchChatRoom }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const canEdit = Boolean(room?.capabilities?.canEdit);
  if (!canEdit || room?.type === "STAFF_TO_STAFF") return null;

  const settings = [...ADMIN_SETTINGS, ...NAME_SETTINGS];

  return (
    <>
      <IconButton aria-label="settings" title={t("chat.settings.button", "إعدادات المحادثة")} onClick={() => setOpen(true)}>
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
  const { t } = useT();
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
      { loading: t("chat.settings.saving", "جاري حفظ الإعدادات..."), setLoading },
    );
    if (res) {
      fetchChatRoom?.();
      if (room?.name !== formValues.name) reFetchRooms?.();
      handleClose();
    }
  }

  return (
    <Dialog open onClose={handleClose} maxWidth="sm" fullWidth sx={{ zIndex: 1302 }}>
      <DialogTitle>{t("chat.settings.title", "إعدادات المحادثة")}</DialogTitle>
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
                  label={t(setting.labelKey, setting.nameFallback)}
                />
              ) : (
                <TextField
                  label={t(setting.labelKey, setting.nameFallback)}
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
        <Button onClick={handleClose} color="error" disabled={loading}>{t("chat.settings.cancel", "إلغاء")}</Button>
        <Button onClick={saveSettings} variant="contained" disabled={loading}>{t("chat.settings.save", "حفظ")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ChatSettings;
