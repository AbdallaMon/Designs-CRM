"use client";

import React from "react";
import { Box, Paper } from "@mui/material";
import Grid from "@mui/material/Grid";
import CreateLeadChatGroup from "@/features/chat/components/dialogs/CreateLeadChatGroup.jsx";

export function RenderTabChat({
  isMobile,
  router,
  renderChatRoomsList,
  renderChatWindow,
  clientLeadId,
  isAdmin,
  createRoom,
  fetchRooms,
  type,
  selectedRoomId,
  setViewMode,
  viewMode,
  createRoomOpen,
  setCreateRoomOpen,
  setSelectedRoomId,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.50",
      }}
    >
      {isMobile ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              flex: 1,
              p: 2,
              pt: 1,
              display: selectedRoomId ? "none" : "block",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                height: "calc(100vh - 78px)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                display: viewMode === "LIST" ? "block" : "none",
              }}
            >
              {renderChatRoomsList()}
            </Paper>
          </Box>
          {/* )} */}

          {viewMode === "CHAT" && (
            <Box sx={{ flex: 1, p: 0 }}>{renderChatWindow()}</Box>
          )}
        </Box>
      ) : (
        <Grid
          container
          spacing={2}
          sx={{ flex: 1, height: "100%", p: 2, m: 0, width: "100%" }}
        >
          <Grid size={{ xs: 12, md: 3 }} sx={{ height: "100%" }}>
            <Paper
              elevation={3}
              sx={{
                height: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              {renderChatRoomsList()}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 9 }} sx={{ height: "calc(100vh - 120px)" }}>
            {renderChatWindow()}
          </Grid>
        </Grid>
      )}
      <CreateLeadChatGroup
        onCreate={createRoom}
        open={createRoomOpen}
        onClose={() => setCreateRoomOpen(false)}
        clientLeadId={clientLeadId}
        isAdmin={isAdmin}
        createRoom={createRoom}
        fetchRooms={fetchRooms}
        onCreated={(room) => {
          setSelectedRoomId(room.id);
        }}
      />{" "}
    </Box>
  );
}
