"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Avatar,
  Grid,
  Container,
  Divider,
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
      <Button variant="contained" onClick={handleClickOpen}>
        See {staff.name} logs
      </Button>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        aria-labelledby="full-screen-dialog-title"
      >
        {/* Dialog Title with Close Icon */}
        <DialogTitle id="full-screen-dialog-title" sx={{ m: 0, p: 2 }}>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
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
      <Card sx={{ boxShadow: 3, padding: 2 }}>
        <CardHeader
          title={`${staff.name} Logs for today`}
          subheader={`View ${staff.name} latest activity.`}
        ></CardHeader>
        <CardContent sx={{ px: { xs: 0, md: 2 } }}>
          <List className="notifications">
            {notifications.map((notification) => (
              <>
                <ListItem
                  key={notification.id}
                  sx={{
                    borderLeft: `2px solid ${
                      NotificationColors[notification.type]
                    }`,
                    my: 1.5,
                    background: colors.bgSecondary,
                    py: 2,
                  }}
                >
                  <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Grid>
                      <Avatar
                        sx={{
                          bgcolor:
                            NotificationColors[notification.type] || "#607d8b",
                          width: 40,
                          height: 40,
                        }}
                      >
                        {notificationIcons[notification.type]}
                      </Avatar>
                    </Grid>

                    <Grid>
                      <Typography variant="body1">
                        {parse(notification.content)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        By
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
                    </Grid>
                  </Grid>
                </ListItem>
                <Divider />
              </>
            ))}
          </List>
        </CardContent>
      </Card>
    </Container>
  );
};

export default UserLogs;
