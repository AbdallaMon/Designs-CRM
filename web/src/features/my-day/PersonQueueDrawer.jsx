"use client";
// Supervisor drill-down: a right drawer showing the selected person's queue via
// /my-day/users/:id (read-only reuse of MyWorkQueue).
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { FiX } from "react-icons/fi";
import MyWorkQueue from "@/features/my-day/MyWorkQueue.jsx";

export default function PersonQueueDrawer({ open, onClose, person }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, maxWidth: "100%" } }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {person?.name ? `${person.name}'s queue` : "Queue"}
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <FiX />
          </IconButton>
        </Stack>
        {person?.userId && <MyWorkQueue userId={person.userId} />}
      </Box>
    </Drawer>
  );
}
