"use client";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
  Stack,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { FaFileContract } from "react-icons/fa";
import CreateContractDialog from "@/features/contracts/CreateContract.jsx";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";
import ViewContract from "@/features/contracts/ViewContract.jsx";
import CloneContract from "@/features/contracts/CloneContract.jsx";
import ContractCard from "@/features/contracts/ContractCard.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";

export default function LeadContractList({
  leadId,
  finalModal,
  updateOuterContract,
  lead,
}) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openView, setOpenView] = useState(false);
  const [id, setId] = useState(null);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneId, setCloneId] = useState(false);
  const theme = useTheme();

  function handleCloneOpen(contractId) {
    setCloneOpen(true);
    setCloneId(contractId);
  }

  function handleCloneClose() {
    setCloneOpen(false);
    setCloneId(null);
  }

  function handleViewOpen(contractId) {
    setOpenView(true);
    setId(contractId);
  }

  function handleClose() {
    setOpenView(false);
    setId(null);
  }

  async function fetchContracts() {
    const req = await getDataAndSet({
      url: `contracts/client-lead/${leadId}`,
      setLoading,
      setData: setContracts,
    });
    if (req && updateOuterContract) {
      updateOuterContract(
        req.data.find((c) => c.status === "IN_PROGRESS" && c.amount > 0)?.id ||
          null
      );
    }
  }

  useEffect(() => {
    if (leadId) {
      fetchContracts();
    }
  }, [leadId]);

  return (
    <Box
      position="relative"
      sx={{
        minHeight: finalModal ? "100vh" : undefined,
        pb: finalModal ? 3 : 0,
        px: finalModal ? { xs: 2, sm: 3 } : 0,
      }}
    >
      {loading && <LoadingOverlay />}

      <Box mb={2.5}>
        <CreateContractDialog
          clientLeadId={leadId}
          onUpdate={fetchContracts}
          lead={lead}
        />
      </Box>

      {contracts?.length > 0 ? (
        <Stack spacing={2}>
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              setContracts={setContracts}
              fetchContracts={fetchContracts}
              handleViewOpen={handleViewOpen}
              handleCloneOpen={handleCloneOpen}
            />
          ))}
        </Stack>
      ) : (
        !loading && (
          <EmptyState
            icon={<FaFileContract />}
            title="No contracts"
            description="Create a contract to get started."
          />
        )
      )}

      <CloneContract
        sourceId={cloneId}
        onCloned={fetchContracts}
        open={cloneOpen}
        setOpen={setCloneOpen}
        handleCloneClose={handleCloneClose}
        handleCloneOpen={handleCloneOpen}
      />
      <Dialog
        open={openView}
        maxWidth="lg"
        fullWidth
        onClose={handleClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.1
            )}, ${alpha(theme.palette.secondary.main, 0.05)})`,
            borderBottom: `1px solid ${theme.palette.divider}`,
            py: 2.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Contract # {id}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <ViewContract id={id} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
