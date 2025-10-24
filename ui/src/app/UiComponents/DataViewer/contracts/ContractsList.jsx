"use client";

import {
  contractLevel,
  contractLevelStatus,
  contractStatus,
} from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  lighten,
  Menu,
  MenuItem,
  Typography,
  useTheme,
  Stack,
  Paper,
  Tooltip,
  alpha,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdClose, MdExpandMore } from "react-icons/md";
import ChipWithIcon from "../utility/ChipWIthIcon";
import CreateContractDialog from "./CreateContract";
import LoadingOverlay from "../../feedback/loaders/LoadingOverlay";
import ViewContract from "./ViewContract";
import { IoMdEye } from "react-icons/io";
import CloneContract from "./CloneContract";
import DeleteModelButton from "../leads/extra/DeleteModelButton";
import { FaCopy } from "react-icons/fa";

export default function LeadContractList({ leadId }) {
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
        minHeight: "100vh",
        py: 3,
        px: { xs: 2, sm: 3 },
      }}
    >
      {loading && <LoadingOverlay />}

      <Box mb={4}>
        <CreateContractDialog clientLeadId={leadId} onUpdate={fetchContracts} />
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

function ContractMenu({
  contract,
  handleViewOpen,
  handleEditOpen,
  setContracts,
  handleCloneOpen,
  fetchContracts,
}) {
  const theme = useTheme();

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

function ContractAccordion({
  contract,
  index,
  setContracts,
  handleViewOpen,
  handleEditOpen,
  fetchContracts,
  handleCloneOpen,
}) {
  const theme = useTheme();
  const statusChip = contractStatus[contract.status];
  const levelConf = contractLevel[contract.level];

  return (
    <Accordion
      defaultExpanded={index === 0}
      sx={{
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
        transition: "all 0.3s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[2],
          borderColor: alpha(theme.palette.primary.main, 0.5),
        },
        "&.Mui-expanded": {
          margin: 0,
        },
      }}
    >
      <AccordionSummary
        expandIcon={<MdExpandMore />}
        aria-controls={`panel-${contract.id}-content`}
        id={`panel-${contract.id}-header`}
        sx={{
          py: 2,
          px: 3,
          background: alpha(theme.palette.primary.main, 0.02),
          borderBottom: `1px solid ${theme.palette.divider}`,
          "&:hover": {
            background: alpha(theme.palette.primary.main, 0.04),
          },
          transition: "all 0.2s ease-in-out",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                minWidth: 200,
              }}
            >
              {contract.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <ChipWithIcon conf={statusChip} />
              <ChipWithIcon conf={levelConf} />
            </Box>
          </Box>
          <ContractMenu
            contract={contract}
            handleEditOpen={handleEditOpen}
            handleViewOpen={handleViewOpen}
            setContracts={setContracts}
            fetchContracts={fetchContracts}
            handleCloneOpen={handleCloneOpen}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          p: 3,
          background: alpha(theme.palette.primary.main, 0.01),
        }}
      >
        <Grid container spacing={2}>
          {contract.stages.map((stage, stageIndex) => (
            <ContractStage stage={stage} key={stage.id} index={stageIndex} />
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

function ContractStage({ stage, index }) {
  const theme = useTheme();
  const conf = contractLevel[stage.title];
  const isCurrent = stage.stageStatus === "IN_PROGRESS";
  const isCompleted = stage.stageStatus === "COMPLETED";
  const statusConf = contractLevelStatus[stage.stageStatus];

  const bgColor = theme.palette[conf.pallete]?.[conf.shade] || "#f5f5f5";
  const statusColor = isCurrent
    ? theme.palette.success.main
    : isCompleted
    ? theme.palette.info.main
    : theme.palette.action.disabled;

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        sx={{
          height: "100%",
          backgroundColor: lighten(isCurrent ? "#4caf50" : bgColor, 0.9),
          border: `2px solid ${
            isCurrent
              ? theme.palette.success.main
              : isCompleted
              ? theme.palette.info.main
              : theme.palette.divider
          }`,
          borderRadius: 2,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.shadows[4],
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background:
              isCurrent || isCompleted
                ? `linear-gradient(90deg, ${statusColor}, ${lighten(
                    statusColor,
                    0.4
                  )})`
                : "transparent",
            borderRadius: "2px",
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box flex={1}>
                <Typography
                  color={conf.pallete}
                  variant="subtitle2"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  {conf.name}
                </Typography>
                <Typography
                  color={conf.pallete}
                  variant="subtitle2"
                  component="div"
                  sx={{
                    fontWeight: 600,
                    mt: 1,
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  {stage.title}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ pt: 0.5 }}>
              <ChipWithIcon conf={statusConf} />
            </Box>

            {isCurrent && (
              <Box
                sx={{
                  mt: 1,
                  px: 1.5,
                  py: 0.75,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: 1,
                  borderLeft: `3px solid ${theme.palette.success.main}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.success.main,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  ● Active Stage
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
