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
  Paper,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import CreateContractDialog from "@/app/UiComponents/DataViewer/contracts/CreateContract.jsx";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import ViewContract from "@/app/UiComponents/DataViewer/contracts/ViewContract.jsx";
import CloneContract from "@/app/UiComponents/DataViewer/contracts/CloneContract.jsx";
import ContractAccordion from "@/app/UiComponents/DataViewer/contracts/ContractAccordion.jsx";

export default function LeadContractList({
  leadId,
  finalModal,
  updateOuterContract,
  lead,
}) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [id, setId] = useState(null);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneId, setCloneId] = useState(false);
  const theme = useTheme();
  function handleCloneOpen(contractId) {
    setCloneOpen(true);
    setCloneId(contractId);
  }

  function handleCloneClose(contractId) {
    setCloneOpen(false);
    setCloneId(null);
  }
  function handleEditOpen(contractId) {
    setOpenEdit(true);
    setId(contractId);
  }

  function handleViewOpen(contractId) {
    setOpenView(true);
    setId(contractId);
  }

  function handleClose() {
    setOpenView(false);
    setOpenEdit(false);
    setId(null);
  }

  async function fetchContracts() {
    const req = await getDataAndSet({
      url: `shared/contracts/client-lead/${leadId}`,
      setLoading,
      setData: setContracts,
    });
    if (req && updateOuterContract) {
      console.log(req, "data");
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
        minHeight: finalModal ? "100vh" : "100%",
        pb: 3,
        px: { xs: 2, sm: 3 },
      }}
    >
      {loading && <LoadingOverlay />}

      <Box mb={4}>
        <CreateContractDialog
          clientLeadId={leadId}
          onUpdate={fetchContracts}
          lead={lead}
        />
      </Box>

      <Stack spacing={2}>
        {contracts?.length > 0
          ? contracts.map((contract, index) => (
              <ContractAccordion
                contract={contract}
                setContracts={setContracts}
                index={index}
                key={contract.id}
                handleEditOpen={handleEditOpen}
                handleViewOpen={handleViewOpen}
                fetchContracts={fetchContracts}
                handleCloneOpen={handleCloneOpen}
              />
            ))
          : !loading && (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Typography color="textSecondary" variant="body1">
                  No contracts found. Create one to get started.
                </Typography>
              </Paper>
            )}
      </Stack>
      <CloneContract
        sourceId={cloneId}
        onCloned={fetchContracts}
        open={cloneOpen}
        setOpen={setCloneOpen}
        handleCloneClose={handleCloneClose}
        handleCloneOpen={handleCloneOpen}
      />
      <Dialog
        open={openView || openEdit}
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
