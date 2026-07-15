"use client";
// Supervisor drill-down: a right drawer showing the selected person's REAL, itemized queue
// via /my-day/users/:id (TargetQueueContent). Opened both from a person card and from a
// rep-scoped exception (which passes a `focus` so the drawer scrolls to that issue).
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { FiX } from "react-icons/fi";
import TargetQueueContent from "@/features/my-day/TargetQueueContent.jsx";

export default function PersonQueueDrawer({ open, onClose, target }) {
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
            {target?.name ? `${target.name}'s queue` : "Queue"}
          </Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <FiX />
          </IconButton>
        </Stack>
        {target?.userId && <TargetQueueContent userId={target.userId} focus={target.focus} />}
      </Box>
    </Drawer>
  );
}
