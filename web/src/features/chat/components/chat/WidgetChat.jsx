"use client";

import React from "react";
import { Box, Paper, Stack, Badge, Fab, IconButton, Slide } from "@mui/material";
import { FaComments, FaExternalLinkAlt } from "react-icons/fa";
import Link from "next/link";
import { CreateGroupDialog } from "@/features/chat/components/dialogs/index.js";

export function RenderWidgetChat({
  selectedRoomId,
  setSelectedRoomId,
  type,
  isMobile,
  router,
  renderChatRoomsList,
  renderChatWindow,
  totalUnread,
  setWidgetOpen,
  isAdmin,
  clientLeadId,
  createRoom,
  fetchRooms,
  createRoomOpen,
  setCreateRoomOpen,
  widgetOpen,
}) {
  return (
    <>
      <Box
        sx={{
          position: "fixed",
          bottom: 16,
          right: 20,
          zIndex: 1400,
        }}
      >
        <Badge
          color="error"
          badgeContent={totalUnread}
          overlap="circular"
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            "& .MuiBadge-badge": {
              fontWeight: 600,
              fontSize: "0.75rem",
              minWidth: "20px",
              height: "20px",
              right: 0,
              top: 0,
            },
          }}
        >
          <Fab
            color="primary"
            size="medium"
            onClick={() => setWidgetOpen((prev) => !prev)}
            sx={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.1)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <FaComments size={20} />
          </Fab>
        </Badge>
      </Box>

      <Slide direction="up" in={widgetOpen} mountOnEnter unmountOnExit>
        <Paper
          elevation={24}
          sx={{
            position: "fixed",
            zIndex: 1301,
            bottom: isMobile ? 12 : 80,
            right: isMobile ? 12 : 16,
            left: isMobile ? 12 : "auto",
            width: isMobile ? "calc(100% - 24px)" : 420,
            height: isMobile ? "75vh" : 640,
            borderRadius: 4,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <Stack direction="row" spacing={1}>
              <Link
                href={
                  selectedRoomId
                    ? `/dashboard/chat?roomId=${selectedRoomId}`
                    : `/dashboard/chat`
                }
                passHref
              >
                <IconButton
                  size="small"
                  component="a"
                  sx={{
                    color: "inherit",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.2)",
                      transform: "scale(1.1)",
                    },
                  }}
                  title="View All Chats"
                >
                  <FaExternalLinkAlt size={14} />
                </IconButton>
              </Link>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {selectedRoomId && renderChatWindow()}
            <Box
              sx={{
                display: selectedRoomId ? "none" : "block",
                overflow: "auto",
                flex: 1,
              }}
            >
              {renderChatRoomsList()}
            </Box>
          </Box>
        </Paper>
      </Slide>
      <CreateGroupDialog
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        clientLeadId={clientLeadId}
        isAdmin={isAdmin}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        onCreated={(room) => {
          setSelectedRoomId(room.id);
          if (isMobile) setViewMode("CHAT");
          if (type === "page") router.replace(`?roomId=${room.id}`);
        }}
      />
    </>
  );
}
