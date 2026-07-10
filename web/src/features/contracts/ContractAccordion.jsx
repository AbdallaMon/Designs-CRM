"use client";

import { contractLevel, contractStatus } from "@/app/helpers/constants";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";
import { MdExpandMore } from "react-icons/md";
import ChipWithIcon from "@/shared/components/common/ChipWithIcon.jsx";
import ContractMenu from "@/features/contracts/ContractMenu.jsx";
import ContractStage from "@/features/contracts/ContractStage.jsx";

export default function ContractAccordion({
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
