"use client";
import React, { useState } from "react";
import {
  alpha,
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Avatar,
  Container,
  CardHeader,
  DialogContent,
  IconButton,
  DialogTitle,
  Dialog,
  Button,
} from "@mui/material";
import parse from "html-react-parser";
import dayjs from "dayjs";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher.js";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import { notificationIcons } from "@/app/helpers/constants.js";
import colors, { NotificationColors } from "@/app/helpers/colors.js";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { MdClose } from "react-icons/md";
import { FiActivity } from "react-icons/fi";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
function UserLogs({ staff, staffId }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      {/* Button to Open the Dialog */}
      <Button
        variant="contained"
        onClick={handleClickOpen}
        startIcon={<FiActivity />}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        See {staff.name} logs
      </Button>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        aria-labelledby="full-screen-dialog-title"
      >
        {/* Dialog Title with Close Icon */}
        <DialogTitle
          id="full-screen-dialog-title"
          sx={{
            m: 0,
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            fontWeight: 700,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: "primary.main",
            }}
          >
            <FiActivity />
          </Box>
          {staff.name} activity log
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              insetInlineEnd: 12,
              top: 12,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <MdClose />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 0,
          }}
        >
          {open && <Logs staff={staff} staffId={staffId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
const Logs = ({ staff, staffId }) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const { data: notifications, loading } = useDataFetcher(
    `admin/users/${staffId}/logs/`,
    false
  );

  return (
    <Container maxWidth="xl" sx={{ marginY: 4, position: "relative" }}>
      {loading && <FullScreenLoader />}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          p: { xs: 1, md: 2 },
        }}
      >
        <CardHeader
          title={`${staff.name} Logs for today`}
          subheader={`View ${staff.name} latest activity.`}
          titleTypographyProps={{ fontWeight: 800 }}
        ></CardHeader>
        <CardContent sx={{ px: { xs: 0, md: 2 } }}>
          {!loading && notifications.length === 0 ? (
            <Box
              sx={{
                py: 6,
                textAlign: "center",
                borderRadius: 2,
                border: (theme) => `1px dashed ${theme.palette.divider}`,
                bgcolor: (theme) => alpha(theme.palette.text.primary, 0.02),
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                No activity to show today.
              </Typography>
            </Box>
          ) : (
            <List className="notifications" sx={{ display: "grid", gap: 1.25 }}>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    borderInlineStart: `3px solid ${
                      NotificationColors[notification.type] || "#607d8b"
                    }`,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    background: colors.bgSecondary,
                    py: 2,
                    gap: 1.5,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor:
                        NotificationColors[notification.type] || "#607d8b",
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                    }}
                  >
                    {notificationIcons[notification.type]}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                      {parse(notification.content)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      By{" "}
                      {isAdmin ? (
                        notification.staff ? (
                          <a
                            href={"/dashboard/users/" + notification.staffId}
                          >
                            {" "}
                            {notification.staff?.name}
                          </a>
                        ) : (
                          notification.client?.name
                        )
                      ) : (
                        notification.client?.name || "Admin"
                      )}
                      {` at ${dayjs(notification.createdAt).format(
                        "YYYY-MM-DD HH:mm:ss"
                      )}`}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default UserLogs;
