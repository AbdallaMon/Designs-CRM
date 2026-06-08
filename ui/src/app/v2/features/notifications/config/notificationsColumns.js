// Declarative column descriptors for the notifications list — the config IS the contract
// (columns live here, not inline in the page). Consumed by <DataTablePage> via `accessor(row)`.
// Single-language Arabic / RTL; uses ONLY the shared <StatusChip> primitive for the type/level.
//
// Backend row shape (NotificationDto, schema.prisma `Notification`):
//   { id, type, content, contentType, link, isRead, createdAt, ... }
//   - type    → NotificationType enum  → resolveNotificationChip → <StatusChip> (label+color)
//   - content → the notification text  (TEXT/HTML; we render TEXT plainly, strip tags otherwise)
//   - link    → deep-link to the source record (drives the row href)
//   - isRead  → unread emphasis (bold text + a leading unread dot)

import { Box, Stack, Typography } from "@mui/material";
import { StatusChip } from "@/app/v2/shared/components";
import { resolveNotificationChip } from "./notificationTypes.js";
import { formatRelative, formatAbsolute } from "./formatTime.js";

// Plain text from a notification body. HTML notifications are rare here; strip tags so we never
// render raw markup in a table cell.
function notificationText(row) {
  const raw = row?.content ?? "";
  if (row?.contentType === "HTML") return raw.replace(/<[^>]*>/g, " ").trim();
  return String(raw).trim();
}

export const notificationsColumns = [
  {
    field: "type",
    headerName: "النوع",
    width: 160,
    accessor: (row) => {
      const chip = resolveNotificationChip(row?.type);
      return <StatusChip domain={chip.domain} status={chip.status} label={chip.label} />;
    },
  },
  {
    field: "content",
    headerName: "الإشعار",
    accessor: (row) => {
      const unread = !row?.isRead;
      const text = notificationText(row) || "—";
      return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          {/* unread dot — emphasis is NOT color-only; the text weight also changes */}
          <Box
            aria-hidden={!unread}
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: unread ? "primary.main" : "transparent",
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: unread ? 700 : 400,
              color: unread ? "text.primary" : "text.secondary",
              textAlign: "start",
              whiteSpace: "normal",
              wordBreak: "break-word",
            }}
          >
            {text}
            {unread && (
              <Box component="span" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                {" "}(غير مقروء)
              </Box>
            )}
          </Typography>
        </Stack>
      );
    },
  },
  {
    field: "createdAt",
    headerName: "الوقت",
    width: 150,
    accessor: (row) => (
      <Typography
        variant="caption"
        color="text.secondary"
        title={formatAbsolute(row?.createdAt)}
        sx={{ whiteSpace: "nowrap" }}
      >
        {formatRelative(row?.createdAt)}
      </Typography>
    ),
  },
];
