"use client";

import { Box, Typography } from "@mui/material";
import { useT } from "@/app/v2/lib/i18n";

export function ChatTypingIndicator({ typingUsers }) {
  const { t } = useT();
  if (!typingUsers || typingUsers.length === 0) return null;

  return (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        animation: "fadeIn 0.3s ease-in",
        "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      <Typography variant="caption" sx={{ fontStyle: "italic", color: "text.secondary" }}>
        {typingUsers.length === 1
          ? `${typingUsers[0]?.message || t("chat.typing.default", "يكتب الآن")}`
          : t("chat.typing.many", "{count} أشخاص يكتبون").replace("{count}", typingUsers.length)}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "primary.main",
              animation: "bounce 1.4s infinite",
              animationDelay: `${i * 0.2}s`,
              "@keyframes bounce": {
                "0%, 80%, 100%": { opacity: 0.5 },
                "40%": { opacity: 1 },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
