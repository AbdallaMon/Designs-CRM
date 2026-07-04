"use client";
import { useState } from "react";
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
import { MdClose, MdChat, MdOpenInFull } from "react-icons/md";
import { TabSection } from "../shared/tabKit";

export default function ChatsTab({ clientLeadId }) {
  // Open the conversation fullscreen by default when the Chats tab is entered
  // (the user gets the roomy view immediately; closing it reveals the inline view).
  const [fullscreen, setFullscreen] = useState(true);
  const theme = useTheme();

  return (
    <TabSection
      icon={<MdChat />}
      title="Chats"
      description="Message the client and your team about this lead."
      action={
        <Button
          onClick={() => setFullscreen(true)}
          variant="outlined"
          size="small"
          startIcon={<MdOpenInFull />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Fullscreen
        </Button>
      }
    >
      {/* Inline conversation (ChatContainer self-sizes). Unmounts while fullscreen is
          open so only one chat instance is ever live. */}
      {!fullscreen && (
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2.5,
            overflow: "hidden",
          }}
        >
          <ChatContainer type="tab" clientLeadId={clientLeadId} />
        </Box>
      )}

      <Dialog open={fullscreen} onClose={() => setFullscreen(false)} fullScreen>
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
          <IconButton onClick={() => setFullscreen(false)} sx={{ color: theme.palette.grey[500] }}>
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {fullscreen && <ChatContainer type="tab" clientLeadId={clientLeadId} />}
        </DialogContent>
      </Dialog>
    </TabSection>
  );
}
