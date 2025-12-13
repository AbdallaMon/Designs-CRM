"use client";
import React, { useState, useEffect } from "react";
import {
  Badge,
  IconButton,
  Menu,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  Box,
  ListItemIcon,
} from "@mui/material";
import { FaBell, FaClock } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { NotificationType } from "@/app/helpers/constants";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";
import parse from "html-react-parser";
import { NotificationColors } from "@/app/helpers/colors.js";
import { useSocket } from "../DataViewer/chat/hooks/useSocket";

dayjs.extend(relativeTime);
dayjs.locale("ar");

const url = process.env.NEXT_PUBLIC_URL;

const NotificationsIcon = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const notificationSound =
    typeof Audio !== "undefined" && new Audio("/notification-sound.mp3");
  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const response = await fetch(
          `${url}/shared/utilities/notifications?userId=${user.id}&`,
          {
            credentials: "include",
          }
        );
        const res = await response.json();
        setNotifications(res.data);
        setUnreadCount(
          res.data.filter((notification) => !notification.isRead).length
        );
      } catch (error) {
        // Error fetching unread notifications
      }
    };

    if (user) {
      fetchUnreadNotifications();
    }
  }, [user]);

  // Use socket events hook
  useSocket({
    onNotification: (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1); // Increase unread count
      if (notificationSound) {
        notificationSound.play().catch((error) => {
          // Error playing notification sound
        });
      }
    },
  });

  useEffect(() => {
    if (open) {
      const handleOpenNotificationPaper = async () => {
        try {
          await fetch(`${url}/utility/notification/users/${user.id}`, {
            method: "POST",
          });
          handleMarkAsRead();
        } catch (error) {
          console.error("Error marking notifications as read:", error);
        }
      };
      handleOpenNotificationPaper();
    }
  }, [open]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const renderNotificationContent = (content) => {
    return content.length > 100 ? `${content.slice(0, 100)}...` : content;
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        color="inherit"
        aria-expanded={open ? "true" : undefined}
        sx={{ mr: 1 }}
      >
        <Badge badgeContent={unreadCount} color="primary">
          <FaBell size={20} />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="basic-menu"
        open={open}
        onClose={handleClose}
        sx={{
          "& .MuiList-root": {
            py: 0,
          },
          "& .MuiPaper-root": {
            width: "350px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            p: 0,
          },
        }}
      >
        <List
          sx={{
            maxHeight: "400px",
            p: 0,
            overflowY: "auto",
          }}
        >
          {notifications?.length === 0 ? (
            <Typography textAlign="center" sx={{ padding: "16px" }}>
              No new Notification
            </Typography>
          ) : (
            <>
              {notifications?.map((notification) => {
                const notificationTime = dayjs(notification.createdAt);
                const displayTime = notificationTime.isBefore(
                  dayjs().subtract(1, "day")
                )
                  ? notificationTime.format("DD/MM/YYYY HH:mm")
                  : notificationTime.fromNow();
                return (
                  <ListItem
                    key={notification.id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f0f4f8",
                      },
                      padding: "12px 16px",
                      borderBottom: `1px solid ${
                        NotificationColors[notification.type]
                      }`,
                      backgroundColor: notification.isRead
                        ? "inherit"
                        : "#f5f5f5",
                    }}
                    className="notifications"
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FaBell
                        style={{ color: NotificationColors[notification.type] }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          component="span"
                          sx={{
                            color: NotificationColors[notification.type],
                            fontWeight: notification.isRead ? "normal" : "bold",
                          }}
                        >
                          {NotificationType[notification.type]}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Box>{parse(notification.content)}</Box>
                          <Box
                            display="flex"
                            alignItems="center"
                            color="text.secondary"
                            mt={0.5}
                          >
                            <FaClock style={{ marginRight: 4 }} />
                            <Typography variant="caption">
                              {displayTime}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </>
          )}
        </List>
        {notifications.length > 0 && (
          <Button
            sx={{
              display: "flex",
              justifyContent: "space-between",
              p: "8px 16px",
              color: "#1a73e8",
              fontWeight: "bold",
              backgroundColor: "white",
            }}
            component={Link}
            href="/dashboard/notifications"
          >
            View all notification
          </Button>
        )}
      </Menu>
    </>
  );
};

export default NotificationsIcon;
