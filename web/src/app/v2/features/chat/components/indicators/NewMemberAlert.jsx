"use client";

import { Box, Typography, IconButton } from "@mui/material";
import { FaTimes } from "react-icons/fa";
import { useT } from "@/app/v2/lib/i18n";

export function NewMemberAlert({ newMembersAdded, onClose }) {
  const { t } = useT();
  if (!newMembersAdded || newMembersAdded.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        p: 1.5,
        bgcolor: "info.lighter",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "info.main",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: "info.main" }}>
        {newMembersAdded.map((m) => m.name || m.user?.name || t("chat.newMember.fallback", "عضو")).join("، ")}{" "}
        {t("chat.newMember.added", "تمت إضافته إلى المحادثة.")}
      </Typography>
      <IconButton size="small" onClick={onClose} sx={{ ml: 1, minWidth: "auto" }}>
        <FaTimes size={12} />
      </IconButton>
    </Box>
  );
}
