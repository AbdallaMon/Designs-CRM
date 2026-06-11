"use client";

// Authed contract detail page. URL-tab-driven (?tab=overview|stages|payments|drawings|special)
// so back/forward + deep links work. Loads the contract via the v2 service (object scope
// enforced server-side). Surfaces the lifecycle actions (edit basics, cancel, generate signing
// token) + the four CRUD panels. Every action is gated on a CONTRACT.* permission code (the
// contract dto emits NO capabilities.* — scope is server-enforced). Single-language Arabic/RTL.

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Box, Button, Card, CardContent, Chip, Container, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, Stack, Tab, Tabs, TextField, Typography, alpha, useTheme,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { PageHeader } from "@/app/v2/shared/components";
import { useContractDetail } from "../hooks/useContractDetail.js";
import contractsService from "../contracts.service.js";
import { runContractMutation } from "../contracts.mutations.js";
import { CONTRACT_STATUS, CONTRACT_LEVEL, formatAED, emirateOrCountryLabel } from "../config/contractConstants.js";
import { StagesPanel, PaymentsPanel, DrawingsPanel, SpecialItemsPanel } from "../components/authed/ContractDetailPanels.jsx";
import ConfirmActionDialog from "../components/authed/ConfirmActionDialog.jsx";

const P = PERMISSIONS.CONTRACT;

const TABS = [
  { key: "overview", label: "نظرة عامة" },
  { key: "stages", label: "المراحل" },
  { key: "payments", label: "الدفعات" },
  { key: "drawings", label: "المخططات" },
  { key: "special", label: "البنود الخاصة" },
];

function OverviewSection({ contract, canEdit, onEdit }) {
  const theme = useTheme();
  const statusConf = CONTRACT_STATUS[contract.status];
  const levelConf = CONTRACT_LEVEL[contract.level] || CONTRACT_LEVEL.null;
  const lead = contract.clientLead || {};
  const client = lead.client || {};
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{contract.title}</Typography>
            <Stack direction="row" spacing={1}>
              {statusConf && <Chip size="small" color={statusConf.color} label={statusConf.name} />}
              <Chip size="small" variant="outlined" color={levelConf.color} label={levelConf.name} />
              {canEdit && <Button size="small" variant="outlined" onClick={onEdit}>تعديل الأساسيات</Button>}
            </Stack>
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="body2" color="text.secondary">العميل: {client.arName || client.name || "—"}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="body2" color="text.secondary">العنوان: {emirateOrCountryLabel({ emirate: lead.emirate, country: lead.country })}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="body2" color="text.secondary">المبلغ: {formatAED(contract.amount)}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography variant="body2" color="text.secondary">الإجمالي شامل الضريبة: {formatAED(contract.totalAmount)}</Typography></Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

function EditBasicsDialog({ contract, onClose, onChanged }) {
  const [form, setForm] = useState({
    title: contract.title || "",
    enTitle: contract.enTitle || "",
    arName: contract.clientLead?.client?.arName || "",
    enName: contract.clientLead?.client?.enName || "",
  });
  const [busy, setBusy] = useState(false);

  async function submit() {
    const res = await runContractMutation(
      () => contractsService.updateBasics(contract.id, {
        title: form.title,
        enTitle: form.enTitle,
        arName: form.arName,
        enName: form.enName,
      }),
      { loading: "جاري حفظ التعديلات...", setLoading: setBusy },
    );
    if (res) { onChanged?.(); onClose(); }
  }

  return (
    <Dialog open onClose={onClose} dir="rtl" maxWidth="sm" fullWidth>
      <DialogTitle>تعديل أساسيات العقد</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="نوع العقد (عربي)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth size="small" />
          <TextField label="نوع العقد (إنجليزي)" value={form.enTitle} onChange={(e) => setForm({ ...form, enTitle: e.target.value })} fullWidth size="small" />
          <TextField label="اسم العميل (عربي)" value={form.arName} onChange={(e) => setForm({ ...form, arName: e.target.value })} fullWidth size="small" />
          <TextField label="اسم العميل (إنجليزي)" value={form.enName} onChange={(e) => setForm({ ...form, enName: e.target.value })} fullWidth size="small" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button onClick={submit} variant="contained" disabled={busy}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ContractDetailPage({ contractId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canEdit = hasPermission(P.EDIT);
  const canCancel = hasPermission(P.CANCEL);
  const canGenerateToken = hasPermission(P.GENERATE_PDF_TOKEN);

  const { contract, loading, refetch } = useContractDetail(contractId, { autoFetch: canView });
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const requested = sp.get("tab");
  const active = TABS.some((t) => t.key === requested) ? requested : "overview";

  function selectTab(key) {
    const params = new URLSearchParams(sp.toString());
    params.set("tab", key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const isCancelled = contract?.status === "CANCELLED";

  async function doCancel() {
    const res = await runContractMutation(() => contractsService.cancel(contractId), { loading: "جاري إلغاء العقد..." });
    if (res) refetch();
  }
  async function doGenerateToken() {
    const res = await runContractMutation(() => contractsService.generatePdfToken(contractId), { loading: "جاري إنشاء رابط التوقيع..." });
    if (res) refetch();
  }

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary" textAlign="center">لا تملك صلاحية عرض هذا العقد</Typography>
      </Container>
    );
  }

  function renderActive() {
    if (!contract) return null;
    switch (active) {
      case "overview": return <OverviewSection contract={contract} canEdit={canEdit} onEdit={() => setEditOpen(true)} />;
      case "stages": return <StagesPanel contract={contract} onChanged={refetch} />;
      case "payments": return <PaymentsPanel contract={contract} onChanged={refetch} />;
      case "drawings": return <DrawingsPanel contract={contract} onChanged={refetch} />;
      case "special": return <SpecialItemsPanel contract={contract} onChanged={refetch} />;
      default: return null;
    }
  }

  // Parent-lead breadcrumb so the contract is no longer a dead-end: the lead crumb links back
  // to the lead hub. clientLead.client.name is already in the payload (used in OverviewSection).
  const leadId = contract?.clientLeadId;
  const leadName = contract?.clientLead?.client?.name;
  const breadcrumbs = [
    { label: "المبيعات" },
    { label: "الصفقات", href: "/v2/leads" },
    ...(leadId != null
      ? [{ label: `${leadName || "العميل"} #${leadId}`, href: `/v2/leads/${leadId}` }]
      : []),
    { label: `العقد #${contractId}` },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} dir="rtl">
      <PageHeader
        title={`العقد #${contractId}`}
        roleChip={false}
        breadcrumbs={breadcrumbs}
      >
        {canGenerateToken && !isCancelled && <Button variant="outlined" onClick={doGenerateToken}>إنشاء رابط التوقيع</Button>}
        {canCancel && !isCancelled && <Button variant="outlined" color="error" onClick={() => setConfirmCancel(true)}>إلغاء العقد</Button>}
      </PageHeader>

      <Tabs value={active} onChange={(_e, v) => selectTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>

      <Box sx={{ minHeight: 200 }}>
        {loading && !contract ? <Typography color="text.secondary">جاري التحميل...</Typography> : renderActive()}
      </Box>

      {editOpen && contract && <EditBasicsDialog contract={contract} onClose={() => setEditOpen(false)} onChanged={refetch} />}
      <ConfirmActionDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={doCancel}
        title="إلغاء هذا العقد؟"
        description="سيتم وضع علامة على العقد كملغي وإنشاء نسخة PDF ملغاة. لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="إلغاء العقد"
      />
    </Container>
  );
}

export default ContractDetailPage;
