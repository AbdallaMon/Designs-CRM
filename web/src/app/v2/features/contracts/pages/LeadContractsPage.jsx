"use client";

// Authed contract management — the per-lead contracts list. Ported from the legacy
// LeadContractList / ContractsList, Arabic-only, wired to the v2 contracts service. Lists the
// lead's contracts as accordions (status + level chips, stage cards), with a create button and
// per-contract lifecycle actions (view detail, cancel, generate signing token). Every action is
// gated on a CONTRACT.* permission code; object scope is enforced server-side (lead-scope) —
// the contract dto emits NO capabilities.*.
//
// Phase 3 restyle (behavior-frozen): the body lives in a shared <SectionCard> ("العقود"), status
// reads via the shared <StatusChip domain="contract" />, surface tints use theme tokens
// (action.hover / divider / background.default) instead of alpha(primary,…), and the empty /
// loading states use the shared <EmptyState> / <LoadingState>. The accordion + stage cards
// structure and ALL actions/data are unchanged. PDF generation is untouched.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, Chip,
  Grid, IconButton, Stack, Tooltip, Typography, useTheme,
} from "@mui/material";
import { MdExpandMore } from "react-icons/md";
import { IoMdEye } from "react-icons/io";
import { FaLink, FaBan } from "react-icons/fa";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useT } from "@/app/v2/lib/i18n";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { SectionCard, StatusChip, EmptyState, LoadingState } from "@/app/v2/shared/components";
import { useLeadContracts } from "../hooks/useLeadContracts.js";
import contractsService from "../contracts.service.js";
import { runContractMutation } from "../contracts.mutations.js";
import { CONTRACT_LEVEL, STAGE_STATUS } from "../config/contractConstants.js";
import CreateContractDialog from "../components/authed/CreateContractDialog.jsx";
import ConfirmActionDialog from "../components/authed/ConfirmActionDialog.jsx";

const P = PERMISSIONS.CONTRACT;

// Level is NOT a contract STATUS (no entry in the contract token map), so we drive the shared
// chip's visible Arabic text via an explicit `label` (the level name) and let the semantic
// fall back to neutral — keeping the displayed level text identical to the legacy LevelChip.
function LevelChip({ level }) {
  const conf = CONTRACT_LEVEL[level] || CONTRACT_LEVEL.null;
  return <StatusChip domain="contract" status={level ?? "null"} label={conf.name} />;
}

function ContractStageCard({ stage }) {
  const { t } = useT();
  const theme = useTheme();
  const levelConf = CONTRACT_LEVEL[stage.title] || CONTRACT_LEVEL.null;
  const statusConf = STAGE_STATUS[stage.stageStatus] || STAGE_STATUS.NOT_STARTED;
  const isCurrent = stage.stageStatus === "IN_PROGRESS";
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card sx={{ height: "100%", border: `2px solid ${isCurrent ? theme.palette.success.main : theme.palette.divider}`, borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={1.25}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{levelConf.name}</Typography>
            <Typography variant="caption" color="text.secondary">{stage.title}</Typography>
            <Chip size="small" color={statusConf.color} label={statusConf.name} />
            {isCurrent && (
              <Box sx={{ mt: 0.5, px: 1.5, py: 0.75, backgroundColor: theme.palette.action.hover, borderRadius: 1, borderRight: `3px solid ${theme.palette.success.main}` }}>
                <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>{t("contracts.list.currentStage")}</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function ContractActions({ contract, canCancel, canGenerateToken, onChanged }) {
  const { t } = useT();
  const router = useRouter();
  const theme = useTheme();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isCancelled = contract?.status === "CANCELLED";

  async function doCancel() {
    const res = await runContractMutation(() => contractsService.cancel(contract.id), { loading: t("contracts.mutation.cancelling") });
    if (res) onChanged?.();
  }
  async function doGenerateToken() {
    const res = await runContractMutation(() => contractsService.generatePdfToken(contract.id), { loading: t("contracts.mutation.generatingToken") });
    if (res) onChanged?.();
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip title={t("contracts.list.action.view")}>
        <IconButton onClick={() => router.push(`/v2/contracts/detail/${contract.id}`)} size="small" sx={{ color: theme.palette.primary.main }}>
          <IoMdEye size={18} />
        </IconButton>
      </Tooltip>
      {canGenerateToken && !isCancelled && (
        <Tooltip title={t("contracts.list.action.generateToken")}>
          <IconButton onClick={doGenerateToken} size="small"><FaLink /></IconButton>
        </Tooltip>
      )}
      {isCancelled ? (
        <Chip size="small" label={t("contracts.list.cancelledChip")} color="error" />
      ) : (
        canCancel && (
          <Tooltip title={t("contracts.list.action.cancel")}>
            <IconButton onClick={() => setConfirmCancel(true)} size="small" color="error"><FaBan /></IconButton>
          </Tooltip>
        )
      )}
      <ConfirmActionDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={doCancel}
        title={t("contracts.list.cancelConfirm.title")}
        description={t("contracts.list.cancelConfirm.description")}
        confirmLabel={t("contracts.list.cancelConfirm.confirmLabel")}
      />
    </Stack>
  );
}

function ContractAccordion({ contract, index, canCancel, canGenerateToken, onChanged }) {
  const theme = useTheme();
  return (
    <Accordion defaultExpanded={index === 0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: "hidden" }}>
      <AccordionSummary expandIcon={<MdExpandMore />} sx={{ py: 1.5, px: 2, background: theme.palette.action.hover }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: "100%", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 160 }}>{contract.title}</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <StatusChip domain="contract" status={contract.status} />
              <LevelChip level={contract.level} />
            </Box>
          </Box>
          <ContractActions contract={contract} canCancel={canCancel} canGenerateToken={canGenerateToken} onChanged={onChanged} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2, background: theme.palette.background.default }}>
        <Grid container spacing={2}>
          {(contract.stages || []).map((stage) => (
            <ContractStageCard stage={stage} key={stage.id} />
          ))}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
}

export function LeadContractsPage({ leadId, lead }) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.LIST);
  const canCreate = hasPermission(P.CREATE);
  const canCancel = hasPermission(P.CANCEL);
  const canGenerateToken = hasPermission(P.GENERATE_PDF_TOKEN);

  const { contracts, loading, refetch } = useLeadContracts(leadId, { autoFetch: canList });
  const [createOpen, setCreateOpen] = useState(false);

  if (!canList) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
        <Typography color="text.secondary">{t("contracts.list.noAccess")}</Typography>
      </Box>
    );
  }

  const hasContracts = contracts?.length > 0;

  return (
    <Box position="relative" sx={{ pb: 3, px: { xs: 2, sm: 3 }, py: 3 }} dir="rtl">
      <SectionCard
        title={t("contracts.list.title")}
        actions={
          canCreate && (
            <Button variant="contained" onClick={() => setCreateOpen(true)}>{t("contracts.list.create")}</Button>
          )
        }
      >
        <CreateContractDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          clientLeadId={leadId}
          lead={lead}
          onSuccess={refetch}
        />

        {loading ? (
          <LoadingState variant="cards" count={3} columns={1} height={96} />
        ) : !hasContracts ? (
          <EmptyState
            title={t("contracts.list.empty.title")}
            description={canCreate ? t("contracts.list.empty.descCanCreate") : t("contracts.list.empty.descReadonly")}
            action={
              canCreate
                ? { label: t("contracts.list.create"), onClick: () => setCreateOpen(true) }
                : undefined
            }
          />
        ) : (
          <Stack spacing={2}>
            {contracts.map((contract, index) => (
              <ContractAccordion
                key={contract.id}
                contract={contract}
                index={index}
                canCancel={canCancel}
                canGenerateToken={canGenerateToken}
                onChanged={refetch}
              />
            ))}
          </Stack>
        )}
      </SectionCard>
    </Box>
  );
}

export default LeadContractsPage;
