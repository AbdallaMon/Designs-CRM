"use client";
import { useEffect, useState } from "react";
import ChatContainer from "../../chat/ChatContainer";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { MdClose } from "react-icons/md";

export default function ChatsTab({ clientLeadId }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (clientLeadId) {
      setOpen(true);
    }
  }, [clientLeadId]);
  return (
    <Box>
      <Button onClick={() => setOpen(!open)} variant="contained" sx={{ mb: 2 }}>
        {open ? "Close Chats" : "Open Chats"}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen
        maxWidth="md"
      >
        {" "}
        <DialogTitle>
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{
              position: "fixed",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
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
