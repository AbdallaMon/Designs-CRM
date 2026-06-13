"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { FaCopy, FaExternalLinkAlt, FaSyncAlt } from "react-icons/fa";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { ConfirmDialog } from "../../dialogs";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

export default function ChatAccessLinkBox({
  roomId,
  accessToken,
  reFetchRoom, // optional: call after regen to refresh room/token
  disabled,
  clientLeadId,
}) {
  const { loading, setLoading, setAlertSuccess, setAlertError } =
    useToastContext();

  const [openConfirm, setOpenConfirm] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const chatLink = useMemo(() => {
    if (!roomId || !accessToken || !origin) return "";
    return `${origin}/chats?roomId=${roomId}&token=${accessToken}`;
  }, [origin, roomId, accessToken]);

  function handleOpenConfirm() {
    setOpenConfirm(true);
  }
  function handleCloseConfirm() {
    setOpenConfirm(false);
  }

  async function handleCopy() {
    try {
      if (!chatLink) return;
      await navigator.clipboard.writeText(chatLink);
      setAlertSuccess?.("Link copied");
    } catch (e) {
      setAlertError?.("Failed to copy link");
    }
  }

  function handleOpenLink() {
    if (!chatLink) return;
    window.open(chatLink, "_blank", "noopener,noreferrer");
  }

  async function handleConfirmRegenerate() {
    // Backend should generate & save new token, and (optionally) return it.
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/chat/rooms/${roomId}/regenerateToken`,
      false,
      "Regenerating chat token",
      false,
      "POST"
    );

    if (req?.status === 200) {
      setAlertSuccess?.("Token regenerated");
      handleCloseConfirm();
      reFetchRoom?.(); // you refresh room to get the new accessToken
    } else {
      setAlertError?.("Failed to regenerate token");
    }
  }

  if (!roomId || !clientLeadId) return null;

  return (
    <>
      <Stack spacing={1.25}>
        <Box>
          <Typography variant="subtitle2">Client Chat Link</Typography>
          <Typography variant="caption" color="text.secondary">
            Share this link with the client to open the chat directly.
          </Typography>
        </Box>

        <TextField
          size="small"
          value={chatLink || ""}
          placeholder="Link will appear here..."
          fullWidth
          disabled={!chatLink || loading || disabled}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Stack direction="row" spacing={0.5} sx={{ mr: 0.5 }}>
                <Tooltip title="Copy">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleCopy}
                      disabled={!chatLink || loading || disabled}
                    >
                      <FaCopy size={16} />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Open">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleOpenLink}
                      disabled={!chatLink || loading || disabled}
                    >
                      <FaExternalLinkAlt size={16} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            ),
          }}
        />

        <Box>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleOpenConfirm}
            disabled={loading || disabled}
            startIcon={
              loading ? <CircularProgress size={18} /> : <FaSyncAlt size={16} />
            }
          >
            Regenerate Token
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 0.75 }}
          >
            Regenerating will invalidate the old link.
          </Typography>
        </Box>
      </Stack>

      <ConfirmDialog
        title="Regenerate Token"
        description="Are you sure you want to regenerate the token? The old link will stop working."
        open={openConfirm}
        onConfirm={handleConfirmRegenerate}
        onCancel={handleCloseConfirm}
        confirmButtonText="Regenerate"
      />
    </>
  );
}
