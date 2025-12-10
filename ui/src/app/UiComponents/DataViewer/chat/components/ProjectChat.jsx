"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Stack,
  Button,
} from "@mui/material";
import { FaComments, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { ChatWindow } from "./ChatWindow";
import { useChatRooms } from "../hooks/useChatRooms";

export function ProjectChat({ projectId, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const { rooms, createRoom } = useChatRooms({
    projectId,
    category: null,
  });

  useEffect(() => {
    const findOrCreateRoom = async () => {
      // Find existing chat for this project
      let existingRoom = rooms.find(
        (r) => r.projectId === projectId && r.type === "PROJECT_GROUP"
      );

      if (!existingRoom) {
        // Create a new one if not exists
        existingRoom = await createRoom({
          name: `Project Chat #${projectId}`,
          type: "PROJECT_GROUP",
          projectId,
        });
      }

      setRoom(existingRoom);
      setLoading(false);
    };

    findOrCreateRoom();
  }, [projectId, rooms, createRoom]);

  if (compact && !expanded) {
    return (
      <Box sx={{ mb: 2 }}>
        <Paper sx={{ p: 1.5, bgcolor: "success.lighter" }}>
          <Button
            fullWidth
            startIcon={<FaComments />}
            endIcon={<FaChevronDown />}
            onClick={() => setExpanded(true)}
            size="small"
            variant="text"
          >
            Project Chat
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Paper sx={{ overflow: "hidden", height: expanded ? 400 : 0 }}>
        {expanded && (
          <Box
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1.5,
                borderBottom: "1px solid",
                borderColor: "divider",
                bgcolor: "success.lighter",
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <FaComments size={18} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Project Chat
                </Typography>
              </Stack>
              <IconButton size="small" onClick={() => setExpanded(false)}>
                <FaChevronUp size={14} />
              </IconButton>
            </Box>

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <CircularProgress />
              </Box>
            ) : room ? (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <ChatWindow room={room} projectId={projectId} />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  color: "textSecondary",
                }}
              >
                <Typography>Failed to load chat</Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
