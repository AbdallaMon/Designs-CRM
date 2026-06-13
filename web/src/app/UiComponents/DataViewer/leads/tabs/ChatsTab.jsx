"use client";
import { useEffect, useState } from "react";
import ChatContainer from "../../chat/ChatContainer";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { MdClose, MdChat } from "react-icons/md";
import { EmptyState } from "../shared/EmptyState";

export default function ChatsTab({ clientLeadId }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  useEffect(() => {
    if (clientLeadId) {
      setOpen(true);
    }
  }, [clientLeadId]);
  return (
    <Box>
      <EmptyState
        icon={<MdChat />}
        title="Conversations"
        description="Open the chat workspace to message the client and your team about this lead."
        action={
          <Button
            onClick={() => setOpen(true)}
            variant="contained"
            startIcon={<MdChat />}
            sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
          >
            Open Chats
          </Button>
        }
      />

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 2,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: theme.palette.primary.main,
                fontSize: 18,
              }}
            >
              <MdChat />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Chats
            </Typography>
          </Stack>
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{ color: theme.palette.grey[500] }}
          >
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <ChatContainer type="tab" clientLeadId={clientLeadId} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
