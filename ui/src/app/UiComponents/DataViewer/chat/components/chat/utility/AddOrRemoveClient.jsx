"use client";

import { Button, CircularProgress } from "@mui/material";
import { ConfirmDialog } from "../../dialogs";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useState } from "react";

export function AddOrRemoveClient({
  clientLeadId,
  roomId,
  reFetchMembers,
  handleClose,
  isAdded,
}) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const { loading, setLoading } = useToastContext();
  function handleCloseConfirm() {
    setOpenConfirm(false);
  }
  function handleOpenConfirm() {
    setOpenConfirm(true);
  }
  async function handleConfirm() {
    const req = await handleRequestSubmit(
      {
        clientLeadId,
        action: isAdded ? "removeClient" : "addClient",
      },
      setLoading,
      `shared/chat/rooms/${roomId}/manageClient`,
      false,
      isAdded ? "Removing client from chat" : "Adding client to chat",
      false,
      "POST"
    );
    if (req?.status === 200) {
      reFetchMembers();
      handleCloseConfirm();
      handleClose();
    }
  }
  if (!clientLeadId) return null;
  return (
    <>
      <Button
        variant="outlined"
        color={isAdded ? "error" : "primary"}
        onClick={handleOpenConfirm}
        disabled={loading}
      >
        {loading && <CircularProgress size={20} sx={{ mr: 1 }} />}
        {isAdded ? "Remove" : "Add"} Client from Chat
      </Button>
      <ConfirmDialog
        title={isAdded ? "Remove Client" : "Add Client"}
        description={`Are you sure you want to ${
          isAdded ? "remove" : "add"
        } this client ${isAdded ? "from" : "to"} the chat?`}
        open={openConfirm}
        onConfirm={handleConfirm}
        onCancel={handleCloseConfirm}
        confirmButtonText={isAdded ? "Remove" : "Add"}
      ></ConfirmDialog>
    </>
  );
}
