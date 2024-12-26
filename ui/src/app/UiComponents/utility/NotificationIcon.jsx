"use client"
import React, {useState, useEffect} from 'react';
import {
    Badge,
    IconButton,
    Menu,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    Button,
    Typography,
    Box,
    ListItemIcon
} from '@mui/material';
import {FaBell, FaClock} from 'react-icons/fa';
import Link from 'next/link';
import io from 'socket.io-client';
import {useAuth} from "@/app/providers/AuthProvider";
import {NotificationType} from "@/app/helpers/constants";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';
import {FiBell} from "react-icons/fi";

dayjs.extend(relativeTime);
dayjs.locale('ar');

const url = process.env.NEXT_PUBLIC_URL;

const NotificationsIcon = () => {
    const {user} = useAuth();
    const [unreadCount, setUnreadCount] = useState(0); // Count of unread notifications
    const [notifications, setNotifications] = useState([]); // Array of notifications
    const [anchorEl, setAnchorEl] = useState(null); // For MUI Menu (dropdown)
    const open = Boolean(anchorEl);
    const notificationSound = typeof Audio !== "undefined" && new Audio('/notification-sound.mp3');

    useEffect(() => {
        const fetchUnreadNotifications = async () => {
            try {
                const response = await fetch(`${url}/utility/notification?isAdmin=${user.role === "ADMIN"}&userId=${user.id}&`);
                const res = await response.json();
                setNotifications(res.data);
                if (user.role === "ADMIN") {
                    const response = await fetch(`${url}/utility/notification/unread/?userId=${user.id}&isAdmin=${user.role === "ADMIN"}`);
                    const adminRes = await response.json();
                    setUnreadCount(adminRes.data.length)
                } else {
                    setUnreadCount(res.data.filter((notification) => !notification.isRead).length);
                }
                console.log(notifications, "noti")
            } catch (error) {
                console.error('Error fetching unread notifications:', error);
            }
        };

        if (user) {
            fetchUnreadNotifications();
        }
    }, [user]);

    useEffect(() => {
        const socket = io(url, {
            transports: ['websocket', 'polling'], // WebSocket first, then fallback to polling
        });

        if (user?.role === 'ADMIN') {
            socket.emit('join-admin-room', {userId: user.id}); // Pass user ID so they join their own room
        } else {
            socket.emit('join-user-room', {userId: user.id});
        }

        socket.on('notification', (notification) => {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1); // Increase unread count
            if (notificationSound) {
                notificationSound.play().catch((error) => {
                    console.error('Error playing notification sound:', error);
                });
            }
        });

        return () => {
            socket.off('notification');
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (open) {
            const handleOpenNotificationPaper = async () => {
                try {
                    const urlPath = user.role === 'ADMIN' ? `${url}/utility/notification/admins/${user.id}` : `${url}/utility/notification/users/${user.id}`;
                    await fetch(urlPath, {method: 'POST'});
                    handleMarkAsRead();
                } catch (error) {
                    console.error('Error marking notifications as read:', error);
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
        setNotifications((prev) => prev.map((n) => ({...n, isRead: true})));
    };

    const renderNotificationContent = (content) => {
        return content.length > 100 ? `${content.slice(0, 100)}...` : content;
    };

    return (
          <>

              <IconButton
                    onClick={handleOpen}
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    color="inherit"
                    aria-expanded={open ? 'true' : undefined}
              >
                  <Badge badgeContent={unreadCount} color="primary">
                      <FaBell size={20}/>
                  </Badge>
              </IconButton>
              <Menu
                    anchorEl={anchorEl}
                    id="basic-menu"
                    open={open}
                    onClose={handleClose}
                    sx={{
                        "& .MuiList-root": {
                            py: 0
                        }
                        , "& .MuiPaper-root": {
                            width: '350px',
                            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px', p: 0,
                        }
                    }}

              >
                  <List sx={{
                      maxHeight: '400px', p: 0,
                      overflowY: "auto"

                  }}>
                      {notifications.length === 0 ? (
                            <Typography textAlign="center" sx={{padding: '16px'}}>لا يوجد إشعارات جديدة</Typography>
                      ) : (
                            <>
                                {notifications.map((notification) => {
                                    const notificationTime = dayjs(notification.createdAt);
                                    const displayTime = notificationTime.isBefore(dayjs().subtract(1, 'day'))
                                          ? notificationTime.format('DD/MM/YYYY HH:mm')
                                          : notificationTime.fromNow();

                                    return (
                                          notification.href ? (
                                                <ListItem
                                                      key={notification.id}
                                                      button
                                                      component={Link}
                                                      href={notification.href || '#'}
                                                      sx={{
                                                          '&:hover': {
                                                              backgroundColor: '#f0f4f8',
                                                          },
                                                          padding: '12px 16px',
                                                          borderBottom: '1px solid #e0e0e0',
                                                          backgroundColor: notification.isRead ? 'inherit' : '#f5f5f5',
                                                      }}
                                                >
                                                    <ListItemIcon sx={{minWidth: 36}}>
                                                        <FaBell
                                                              style={{color: notification.isRead ? '#9e9e9e' : '#1a73e8'}}/>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                          primary={
                                                              <Typography
                                                                    component="span"
                                                                    sx={{
                                                                        color: 'primary.main',
                                                                        fontWeight: notification.isRead ? 'normal' : 'bold'
                                                                    }}
                                                              >
                                                                  {NotificationType[notification.type]}
                                                              </Typography>
                                                          }
                                                          secondary={
                                                              <>
                                                                  <span>{renderNotificationContent(notification.content)}</span>
                                                                  <Box display="flex" alignItems="center"
                                                                       color="text.secondary" mt={1} gap={1}>
                                                                      <FaClock/>
                                                                      <Typography
                                                                            variant="caption">{displayTime}</Typography>
                                                                  </Box>
                                                              </>
                                                          }
                                                    />
                                                </ListItem>
                                          ) : (
                                                <ListItem
                                                      key={notification.id}
                                                      sx={{
                                                          '&:hover': {
                                                              backgroundColor: '#f0f4f8',
                                                          },
                                                          padding: '12px 16px',
                                                          borderBottom: '1px solid #e0e0e0',
                                                          backgroundColor: notification.isRead ? 'inherit' : '#f5f5f5',
                                                      }}
                                                >
                                                    <ListItemIcon sx={{minWidth: 36}}>
                                                        <FaBell
                                                              style={{color: notification.isRead ? '#9e9e9e' : '#1a73e8'}}/>
                                                    </ListItemIcon>
                                                    <ListItemText
                                                          primary={
                                                              <Typography
                                                                    component="span"
                                                                    sx={{
                                                                        color: 'primary.main',
                                                                        fontWeight: notification.isRead ? 'normal' : 'bold'
                                                                    }}
                                                              >
                                                                  {NotificationType[notification.type]}
                                                              </Typography>
                                                          }
                                                          secondary={
                                                              <>
                                                                  <span>{renderNotificationContent(notification.content)}</span>
                                                                  <Box display="flex" alignItems="center"
                                                                       color="text.secondary" mt={0.5}>
                                                                      <FaClock style={{marginRight: 4}}/>
                                                                      <Typography
                                                                            variant="caption">{displayTime}</Typography>
                                                                  </Box>
                                                              </>
                                                          }
                                                    />
                                                </ListItem>
                                          )
                                    );
                                })}
                            </>
                      )}
                  </List>
                  {notifications.length > 0 && (
                        <Button sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            p: '8px 16px',
                            color: '#1a73e8',
                            fontWeight: 'bold',
                            backgroundColor: "white"
                        }}
                                component={Link}
                                href="/dashboard/notifications"

                        >

                            عرض جميع الإشعارات
                        </Button>
                  )}
              </Menu>
          </>);
};

export default NotificationsIcon;
