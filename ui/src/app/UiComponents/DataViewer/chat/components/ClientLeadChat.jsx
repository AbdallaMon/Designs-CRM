"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Button,
} from "@mui/material";
import { FaComments, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { getData } from "@/app/helpers/functions/getData";
import { ChatWindow } from "./ChatWindow";
import { useChatRooms } from "../hooks/useChatRooms";

export function ClientLeadChat({ clientLeadId, compact = false }) {
  const [expanded, setExpanded] = useState(!compact);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const { rooms, createRoom } = useChatRooms({
    category: null,
  });

  useEffect(() => {
    const findOrCreateRoom = async () => {
      // Find existing chat for this client lead
      let existingRoom = rooms.find((r) => r.clientLeadId === clientLeadId);

      if (!existingRoom) {
        // Create a new one if not exists
        existingRoom = await createRoom({
          name: `Lead Chat #${clientLeadId}`,
          type: "CLIENT_TO_STAFF",
          clientLeadId,
        });
      }

      setRoom(existingRoom);
      setLoading(false);
    };

    findOrCreateRoom();
  }, [clientLeadId, rooms, createRoom]);

  if (compact && !expanded) {
    return (
      <Box sx={{ mb: 2 }}>
        <Paper sx={{ p: 1.5, bgcolor: "info.lighter" }}>
          <Button
            fullWidth
            startIcon={<FaComments />}
            endIcon={<FaChevronDown />}
            onClick={() => setExpanded(true)}
            size="small"
            variant="text"
          >
            Chat for this Lead
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
                bgcolor: "info.lighter",
              }}
            >
              <Stack direction="row" alignItems="center" gap={1}>
                <FaComments size={18} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Lead Chat
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
                <ChatWindow room={room} clientLeadId={clientLeadId} />
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
