"use client";

// One notification row. Presentational + a single click handler — no data fetching, no
// service calls (the page owns those). Mirrors the house row style (features/leads rows,
// features/dashboard RecenteActivity html-react-parser usage):
//   • a colored type icon/dot driven by config/notificationTypes.js (NOT hardcoded per type),
//   • content rendered: HTML-typed content is parsed (html-react-parser, as RecenteActivity
//     does); TEXT content is rendered as a plain string,
//   • the type's Arabic label + relative time (fromNow, Arabic — utlis/helpers.js),
//   • an unread dot when !isRead.
// Clicking the row calls onActivate(notification) — the page marks-read + navigates the link.
// Arabic, RTL.

import parse from "html-react-parser";
import {
  Avatar,
  Box,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { fromNow } from "@/app/v2/utlis/helpers";
import {
  resolveNotificationType,
  notificationToneColor,
} from "../config/notificationTypes.js";

// Render notification content safely: HTML content goes through html-react-parser (same as
// the dashboard RecenteActivity feed); anything else renders as text. Falls back to a dash.
function renderContent(notification) {
  const { content, contentType } = notification || {};
  if (content == null || content === "") return "—";
  if (contentType === "HTML") {
    try {
      return parse(String(content));
    } catch {
      return String(content);
    }
  }
  return String(content);
}

export function NotificationItem({ notification, onActivate }) {
  const theme = useTheme();
  const { label, icon: Icon } = resolveNotificationType(notification?.type);
  const colorKey = notificationToneColor(notification?.type);
  const paletteColor = theme.palette[colorKey]?.main ?? theme.palette.info.main;
  const isRead = Boolean(notification?.isRead);

  return (
    <ListItem
      disablePadding
      divider
      secondaryAction={
        !isRead ? (
          <Box
            aria-label="غير مقروء"
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "primary.main",
            }}
          />
        ) : null
      }
      sx={{ bgcolor: isRead ? "transparent" : "action.hover" }}
    >
      <ListItemButton
        onClick={() => onActivate?.(notification)}
        sx={{ alignItems: "flex-start", gap: 1, py: 1.5 }}
      >
        <ListItemAvatar sx={{ minWidth: 48 }}>
          <Avatar
            sx={{
              bgcolor: `${paletteColor}1f`, // ~12% tint
              color: paletteColor,
              width: 40,
              height: 40,
            }}
          >
            <Icon size={20} />
          </Avatar>
        </ListItemAvatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{ color: paletteColor, fontWeight: 700, display: "block", mb: 0.25 }}
          >
            {label}
          </Typography>
          <Box
            sx={{
              color: "text.primary",
              fontWeight: isRead ? 400 : 600,
              fontSize: "0.9rem",
              wordBreak: "break-word",
              "& p": { m: 0 },
            }}
          >
            {renderContent(notification)}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {notification?.createdAt ? fromNow(notification.createdAt) : ""}
          </Typography>
        </Box>
      </ListItemButton>
    </ListItem>
  );
}

export default NotificationItem;
