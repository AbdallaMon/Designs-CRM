"use client";

import {
  Box,
  IconButton,
  Drawer,
  Typography,
  List,
  ListItemButton,
  Divider,
  CircularProgress,
  Paper,
  Avatar,
} from "@mui/material";
import { MdPushPin, MdClose } from "react-icons/md";
import colors from "@/app/helpers/colors";
import { PinnedMessagePreview } from "@/features/chat/components/window/PinnedMessagePreview.jsx";

export function PinnedMessagesDrawer({
  drawerOpen,
  toggleDrawer,
  loadingPinnedMessages,
  displayedMessages,
  currentIndex,
  handleMessageClick,
  pinnedMessages,
  maxPinned,
}) {
  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={toggleDrawer}
      PaperProps={{ sx: { width: { xs: "90%", sm: 400 }, maxWidth: "100%" } }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            bgcolor: colors.primary,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MdPushPin size={24} />
            <Typography variant="h6" fontWeight="bold">
              Pinned Messages
            </Typography>
          </Box>

          <IconButton onClick={toggleDrawer} sx={{ color: "white" }}>
            <MdClose size={24} />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: "auto" }}>
          {loadingPinnedMessages ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <CircularProgress />
            </Box>
          ) : displayedMessages.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                color: "text.secondary",
              }}
            >
              <Typography>No pinned messages</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {displayedMessages.map((message, index) => (
                <Box key={message.id}>
                  <ListItemButton
                    onClick={() => handleMessageClick(message.id)}
                    sx={{
                      py: 2,
                      px: 2,
                      bgcolor:
                        index === currentIndex
                          ? colors.primary + "10"
                          : "transparent",
                      borderLeft:
                        index === currentIndex
                          ? `4px solid ${colors.primary}`
                          : "4px solid transparent",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        width: "100%",
                        alignItems: "flex-start",
                      }}
                    >
                      <Avatar
                        src={message.sender?.profilePicture}
                        sx={{
                          bgcolor: colors.secondary,
                          width: 40,
                          height: 40,
                        }}
                      >
                        {message.sender?.name?.[0]?.toUpperCase() || "U"}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          color="text.primary"
                        >
                          {message.sender?.name || "Unknown User"}
                        </Typography>

                        <Box
                          sx={{
                            mt: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          <PinnedMessagePreview message={message} />
                        </Box>

                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ mt: 0.5, display: "block" }}
                        >
                          {new Date(message.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemButton>

                  {index < displayedMessages.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            bgcolor: "background.default",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ display: "block" }}
          >
            {displayedMessages.length} pinned message
            {displayedMessages.length !== 1 ? "s" : ""}
            {pinnedMessages.length > maxPinned &&
              ` (showing first ${maxPinned})`}
          </Typography>
        </Paper>
      </Box>
    </Drawer>
  );
}

export default PinnedMessagesDrawer;
