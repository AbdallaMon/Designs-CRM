"use client";

// Authed contract management — the per-lead contracts list. Ported from the legacy
// LeadContractList / ContractsList, Arabic-only, wired to the v2 contracts service. Lists the
// lead's contracts as accordions (status + level chips, stage cards), with a create button and
// per-contract lifecycle actions (view detail, cancel, generate signing token). Every action is
// gated on a CONTRACT.* permission code; object scope is enforced server-side (lead-scope) —
// the contract dto emits NO capabilities.*.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, Chip,
  Grid, IconButton, Paper, Stack, Tooltip, Typography, alpha, useTheme,
} from "@mui/material";
import { MdExpandMore } from "react-icons/md";
import { IoMdEye } from "react-icons/io";
import { FaLink, FaBan } from "react-icons/fa";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useLeadContracts } from "../hooks/useLeadContracts.js";
import contractsService from "../contracts.service.js";
import { runContractMutation } from "../contracts.mutations.js";
import { CONTRACT_STATUS, CONTRACT_LEVEL, STAGE_STATUS } from "../config/contractConstants.js";
import CreateContractDialog from "../components/authed/CreateContractDialog.jsx";
import ConfirmActionDialog from "../components/authed/ConfirmActionDialog.jsx";

const P = PERMISSIONS.CONTRACT;

function StatusChip({ status }) {
  const conf = CONTRACT_STATUS[status];
  if (!conf) return null;
  return <Chip size="small" color={conf.color} label={conf.name} />;
}

function LevelChip({ level }) {
  const conf = CONTRACT_LEVEL[level] || CONTRACT_LEVEL.null;
  return <Chip size="small" variant="outlined" color={conf.color} label={conf.name} />;
}

function ContractStageCard({ stage }) {
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
              <Box sx={{ mt: 0.5, px: 1.5, py: 0.75, backgroundColor: alpha(theme.palette.success.main, 0.1), borderRadius: 1, borderRight: `3px solid ${theme.palette.success.main}` }}>
                <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>● المرحلة الحالية</Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}

function ContractActions({ contract, canCancel, canGenerateToken, onChanged }) {
  const router = useRouter();
  const theme = useTheme();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isCancelled = contract?.status === "CANCELLED";

  async function doCancel() {
    const res = await runContractMutation(() => contractsService.cancel(contract.id), { loading: "جاري إلغاء العقد..." });
    if (res) onChanged?.();
  }
  async function doGenerateToken() {
    const res = await runContractMutation(() => contractsService.generatePdfToken(contract.id), { loading: "جاري إنشاء رابط التوقيع..." });
    if (res) onChanged?.();
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Tooltip title="عرض تفاصيل العقد">
        <IconButton onClick={() => router.push(`/v2/contracts/detail/${contract.id}`)} size="small" sx={{ color: theme.palette.primary.main }}>
          <IoMdEye size={18} />
        </IconButton>
      </Tooltip>
      {canGenerateToken && !isCancelled && (
        <Tooltip title="إنشاء رابط التوقيع">
          <IconButton onClick={doGenerateToken} size="small"><FaLink /></IconButton>
        </Tooltip>
      )}
      {isCancelled ? (
        <Chip size="small" label="ملغي" color="error" />
      ) : (
        canCancel && (
          <Tooltip title="إلغاء العقد">
            <IconButton onClick={() => setConfirmCancel(true)} size="small" color="error"><FaBan /></IconButton>
          </Tooltip>
        )
      )}
      <ConfirmActionDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={doCancel}
        title="إلغاء هذا العقد؟"
        description="سيتم وضع علامة على العقد كملغي وإنشاء نسخة PDF ملغاة. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="إلغاء العقد"
      />
    </Stack>
  );
}

function ContractAccordion({ contract, index, canCancel, canGenerateToken, onChanged }) {
  const theme = useTheme();
  return (
    <Accordion defaultExpanded={index === 0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, overflow: "hidden" }}>
      <AccordionSummary expandIcon={<MdExpandMore />} sx={{ py: 1.5, px: 2, background: alpha(theme.palette.primary.main, 0.02) }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", width: "100%", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 160 }}>{contract.title}</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <StatusChip status={contract.status} />
              <LevelChip level={contract.level} />
            </Box>
          </Box>
          <ContractActions contract={contract} canCancel={canCancel} canGenerateToken={canGenerateToken} onChanged={onChanged} />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2, background: alpha(theme.palette.primary.main, 0.01) }}>
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
  const theme = useTheme();
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
        <Typography color="text.secondary">لا تملك صلاحية عرض العقود</Typography>
      </Box>
    );
  }

  return (
    <Box position="relative" sx={{ pb: 3, px: { xs: 2, sm: 3 }, py: 3 }} dir="rtl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5">عقود العميل المحتمل #{leadId}</Typography>
        {canCreate && (
          <Button variant="contained" onClick={() => setCreateOpen(true)}>إنشاء عقد جديد</Button>
        )}
      </Stack>

      <CreateContractDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        clientLeadId={leadId}
        lead={lead}
        onSuccess={refetch}
      />

      <Stack spacing={2}>
        {contracts?.length > 0
          ? contracts.map((contract, index) => (
              <ContractAccordion
                key={contract.id}
                contract={contract}
                index={index}
                canCancel={canCancel}
                canGenerateToken={canGenerateToken}
                onChanged={refetch}
              />
            ))
          : !loading && (
              <Paper sx={{ p: 4, textAlign: "center", backgroundColor: alpha(theme.palette.primary.main, 0.05), border: `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
                <Typography color="text.secondary">لا توجد عقود. أنشئ عقدًا للبدء.</Typography>
              </Paper>
            )}
        {loading && (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>جاري التحميل...</Typography>
        )}
      </Stack>
    </Box>
  );
}

export default LeadContractsPage;
