"use client";

// One contract as a compact RecordCard — the same vocabulary as the price-offer cards directly
// above it in the tab, so both halves read as one system. Replaces ContractAccordion: no
// auto-expanded stages grid, no nested scroller. Depth lives in the ViewContract dialog, reached
// via ContractMenu's View action.

import { alpha, Stack, Typography, useTheme } from "@mui/material";
import { FaFileContract, FaLayerGroup, FaMoneyBillWave } from "react-icons/fa";
import { contractLevel, contractStatus } from "@/app/helpers/constants";
import { RecordCard, StatusPill, MetaItem } from "@/features/leads/shared/tabKit.jsx";
import ContractMenu from "@/features/contracts/ContractMenu.jsx";
import ContractStageStepper from "@/features/contracts/ContractStageStepper.jsx";

// Contract.amount is Prisma Decimal? → arrives as a STRING over JSON. `.toLocaleString()` on a
// string is a silent no-op, so coerce first and guard NaN/null.
function formatAmount(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return `${n.toLocaleString()} AED`;
}

export default function ContractCard({
  contract,
  setContracts,
  fetchContracts,
  handleViewOpen,
  handleCloneOpen,
}) {
  const theme = useTheme();

  const statusConf = contractStatus[contract?.status];
  const statusColor = statusConf
    ? theme.palette[statusConf.pallete]?.[statusConf.shade] || theme.palette.text.secondary
    : theme.palette.text.secondary;

  // `contract.level` is the computed current-stage title (LEVEL_N | null), NOT the contractLevel
  // column. contractLevel[null] resolves to the "no active stage" entry, so this is always safe.
  const levelConf = contractLevel[contract?.level] ?? contractLevel.null;

  const amount = formatAmount(contract?.amount ?? contract?.totalAmount);
  const stageCount = contract?.stages?.length || 0;

  return (
    <RecordCard
      accent={statusColor}
      leading={
        <Stack
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          <FaFileContract />
        </Stack>
      }
      title={contract?.title || `Contract #${contract?.id ?? ""}`}
      subtitle={levelConf?.name}
      status={statusConf ? <StatusPill label={statusConf.name} color={statusColor} /> : null}
      meta={
        <>
          {amount && <MetaItem icon={<FaMoneyBillWave size={13} />} value={amount} />}
          <MetaItem
            icon={<FaLayerGroup size={13} />}
            value={`${stageCount} ${stageCount === 1 ? "stage" : "stages"}`}
          />
        </>
      }
      actions={
        <ContractMenu
          contract={contract}
          setContracts={setContracts}
          fetchContracts={fetchContracts}
          handleViewOpen={handleViewOpen}
          handleCloneOpen={handleCloneOpen}
        />
      }
    >
      {stageCount > 0 && (
        <ContractStageStepper stages={contract.stages} />
      )}
      {stageCount === 0 && (
        <Typography variant="caption" color="text.secondary">
          No stages yet
        </Typography>
      )}
    </RecordCard>
  );
}
