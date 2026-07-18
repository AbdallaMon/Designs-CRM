"use client";

import {
  Chip,
  IconButton,
  useTheme,
  Tooltip,
  alpha,
} from "@mui/material";
import { IoMdEye } from "react-icons/io";
import DeleteModelButton from "@/shared/components/common/DeleteModelButton.jsx";
import { FaCopy, FaLink } from "react-icons/fa";
import ConfirmWithActionModel from "@/shared/components/models/ConfirmsWithActionModel.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useState } from "react";
import ContractGenerateLinkDialog from "@/features/contracts/ContractGenerateLinkDialog.jsx";

export default function ContractMenu({
  contract,
  handleViewOpen,

  handleCloneOpen,
  fetchContracts,
}) {
  const theme = useTheme();
  const isCancelled = contract?.status === "CANCELLED"; // if your API returns it
  const { setLoading } = useToastContext();
  const [linkOpen, setLinkOpen] = useState(false);
  async function cancelContractReq() {
    const req = await handleRequestSubmit(
      {
        canceled: true,
      },
      setLoading,
      `shared/contracts/${contract.id}/actions/cancel`,
      false,
      "Cancelling",
      false,
      "POST"
    );
    if (req.status === 200) {
      fetchContracts();
      return req;
    }
  }
  return (
    <>
      <Tooltip title="Clone contract" placement="top">
        <IconButton
          size="small"
          onClick={() => handleCloneOpen(contract.id)}
          sx={{
            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
            borderRadius: 2,
          }}
        >
          <FaCopy />
        </IconButton>
      </Tooltip>
      <Tooltip title="View contract details">
        <IconButton
          onClick={() => handleViewOpen(contract.id)}
          size="small"
          sx={{
            color: theme.palette.primary.main,
            "&:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          <IoMdEye size={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Generate session link" placement="top">
        <IconButton
          size="small"
          onClick={() => setLinkOpen(true)}
          sx={{
            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
            borderRadius: 2,
          }}
        >
          <FaLink size={15} />
        </IconButton>
      </Tooltip>
      <ContractGenerateLinkDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        contract={contract}
        onReload={fetchContracts}
      />
      {isCancelled ? (
        <Chip label="Canceled" sx={{ bgcolor: "error.main", color: "white" }} />
      ) : (
        <ConfirmWithActionModel
          title="Mark this contract as canceled?"
          description="This will mark the contract as canceled. You can still clone it later."
          isDelete
          label={isCancelled ? "Canceled" : "Mark as canceled"}
          color="error"
          size="small"
          fullWidth={false}
          removeAfterConfirm={true}
          handleConfirm={cancelContractReq}
        />
      )}
      <DeleteModelButton
        item={contract}
        model={"contract"}
        contentKey="title"
        onDelete={() => {
          fetchContracts();
        }}
      />{" "}
    </>
  );
}
