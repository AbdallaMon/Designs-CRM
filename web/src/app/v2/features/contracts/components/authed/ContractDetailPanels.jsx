"use client";

// Authed contract-detail panels: stages, payments, drawings, special-items. Each panel offers
// the CRUD + workflow actions the BE exposes, gated on the matching CONTRACT.* permission code
// (object scope enforced server-side — no capabilities.* on the contract dto). Mutations go
// through the contracts service + runContractMutation (CODE → Arabic). Single-language Arabic.
//
// Endpoint/action map per panel:
//   Stages:        POST /:id/stages · PUT /:id/stages/:stageId · DELETE /:id/stages/:stageId   [contract.stage.manage]
//   Payments:      POST/PUT/DELETE /:id/payments[/:pid]
//                  POST /:id/payments/:pid/actions/change-status
//                  POST /payments/:pid/actions/update-amounts                                   [contract.payment.manage]
//   Drawings:      POST/PUT/DELETE /:id/drawings[/:drawId]                                      [contract.drawing.manage]
//   SpecialItems:  POST/PUT/DELETE /:id/special-items[/:itemId]                                 [contract.special_item.manage]

import { useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Grid, IconButton, MenuItem, Stack, TextField, Tooltip, Typography, alpha, useTheme,
} from "@mui/material";
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useT } from "@/app/v2/lib/i18n";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import contractsService from "../../contracts.service.js";
import { runContractMutation } from "../../contracts.mutations.js";
import { CONTRACT_LEVELSENUM, STAGE_STATUS, formatAED } from "../../config/contractConstants.js";

const P = PERMISSIONS.CONTRACT;

const isPositiveFinite = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
};
const isNonNegFinite = (v) => {
  if (v === "" || v == null) return true;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0;
};

function PanelHeader({ title, onAdd, addLabel }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
      {onAdd && <Button startIcon={<FaPlus />} onClick={onAdd} variant="contained" size="small">{addLabel}</Button>}
    </Stack>
  );
}

// ── Stages ─────────────────────────────────────────────────────────────────────────────
export function StagesPanel({ contract, onChanged }) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.STAGE_MANAGE);
  const [dialog, setDialog] = useState(null); // { mode:'create'|'edit', stage }
  const stages = contract?.stages || [];

  return (
    <Box>
      <PanelHeader title={t("contracts.panels.stages.title")} onAdd={canManage ? () => setDialog({ mode: "create", stage: { levelEnum: "", deliveryDays: "", deptDeliveryDays: "" } }) : undefined} addLabel={t("contracts.panels.stages.add")} />
      <Grid container spacing={2}>
        {stages.map((stage) => {
          const conf = STAGE_STATUS[stage.stageStatus] || STAGE_STATUS.NOT_STARTED;
          return (
            <Grid key={stage.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{stage.title}</Typography>
                      <Chip size="small" color={conf.color} label={conf.name} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{t("contracts.panels.stages.deliveryDays")} {stage.deliveryDays ?? "—"}</Typography>
                    {canManage && (
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => setDialog({ mode: "edit", stage })}><FaEdit /></IconButton>
                        <IconButton size="small" color="error" onClick={async () => {
                          const res = await runContractMutation(() => contractsService.deleteStage(contract.id, stage.id), { loading: t("contracts.panels.stages.deleting") });
                          if (res) onChanged?.();
                        }}><FaTrash /></IconButton>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
        {stages.length === 0 && <Grid size={12}><Typography color="text.secondary">{t("contracts.panels.stages.empty")}</Typography></Grid>}
      </Grid>
      {dialog && <StageDialog dialog={dialog} contractId={contract.id} onClose={() => setDialog(null)} onChanged={onChanged} />}
    </Box>
  );
}

function StageDialog({ dialog, contractId, onClose, onChanged }) {
  const { t } = useT();
  const isCreate = dialog.mode === "create";
  const [form, setForm] = useState({
    levelEnum: dialog.stage?.levelEnum || "",
    deliveryDays: dialog.stage?.deliveryDays ?? "",
    deptDeliveryDays: dialog.stage?.deptDeliveryDays ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (isCreate && !form.levelEnum) { setErr(t("contracts.panels.stages.err.selectStage")); return; }
    if (form.deliveryDays !== "" && !isNonNegFinite(form.deliveryDays)) { setErr(t("contracts.panels.stages.err.deliveryDays")); return; }
    if (form.deptDeliveryDays !== "" && !isNonNegFinite(form.deptDeliveryDays)) { setErr(t("contracts.panels.stages.err.deptDays")); return; }
    const fn = isCreate
      ? () => contractsService.createStage(contractId, {
          levelEnum: form.levelEnum,
          deliveryDays: form.deliveryDays === "" ? undefined : Number(form.deliveryDays),
          deptDeliveryDays: form.deptDeliveryDays === "" ? undefined : Number(form.deptDeliveryDays),
        })
      : () => contractsService.updateStage(contractId, dialog.stage.id, {
          deliveryDays: form.deliveryDays === "" ? undefined : Number(form.deliveryDays),
          deptDeliveryDays: form.deptDeliveryDays === "" ? undefined : Number(form.deptDeliveryDays),
        });
    const res = await runContractMutation(fn, { loading: t("contracts.panels.saving"), setLoading: setBusy });
    if (res) { onChanged?.(); onClose(); }
  }

  return (
    <Dialog open onClose={onClose} dir="rtl" maxWidth="xs" fullWidth>
      <DialogTitle>{isCreate ? t("contracts.panels.stages.dialog.add") : t("contracts.panels.stages.dialog.edit")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Typography color="error" variant="body2">{err}</Typography>}
          {isCreate && (
            <TextField select label={t("contracts.panels.stages.field.stage")} value={form.levelEnum} onChange={(e) => setForm({ ...form, levelEnum: e.target.value })} fullWidth size="small">
              {CONTRACT_LEVELSENUM.map((l) => <MenuItem key={l.enum} value={l.enum}>{l.label} ({l.enum})</MenuItem>)}
            </TextField>
          )}
          <TextField type="number" label={t("contracts.panels.stages.field.deliveryDays")} value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} fullWidth size="small" />
          <TextField type="number" label={t("contracts.panels.stages.field.deptDays")} value={form.deptDeliveryDays} onChange={(e) => setForm({ ...form, deptDeliveryDays: e.target.value })} fullWidth size="small" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>{t("contracts.common.cancel")}</Button>
        <Button onClick={submit} variant="contained" disabled={busy}>{t("contracts.common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Payments ───────────────────────────────────────────────────────────────────────────
export function PaymentsPanel({ contract, onChanged }) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.PAYMENT_MANAGE);
  const [dialog, setDialog] = useState(null); // {mode, payment}
  const payments = contract?.paymentsNew || contract?.payments || [];

  return (
    <Box>
      <PanelHeader title={t("contracts.panels.payments.title")} onAdd={canManage ? () => setDialog({ mode: "create", payment: { amount: "", note: "" } }) : undefined} addLabel={t("contracts.panels.payments.add")} />
      <Stack spacing={1.5}>
        {payments.map((p) => (
          <Card key={p.id} variant="outlined">
            <CardContent>
              <Grid container spacing={1} alignItems="center">
                <Grid size={{ xs: 6, sm: 3 }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatAED(p.amount)}</Typography></Grid>
                <Grid size={{ xs: 6, sm: 3 }}><Chip size="small" label={p.status || "—"} /></Grid>
                <Grid size={{ xs: 12, sm: 3 }}><Typography variant="body2" color="text.secondary">{p.conditionItem?.labelAr || p.note || "—"}</Typography></Grid>
                {canManage && (
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" flexWrap="wrap">
                      <Tooltip title={t("contracts.panels.payments.action.edit")}><IconButton size="small" onClick={() => setDialog({ mode: "edit", payment: p })}><FaEdit /></IconButton></Tooltip>
                      <Button size="small" onClick={() => setDialog({ mode: "status", payment: p })}>{t("contracts.panels.payments.action.status")}</Button>
                      <Button size="small" onClick={() => setDialog({ mode: "amounts", payment: p })}>{t("contracts.panels.payments.action.amounts")}</Button>
                      <Tooltip title={t("contracts.panels.payments.action.delete")}><IconButton size="small" color="error" onClick={async () => {
                        const res = await runContractMutation(() => contractsService.deletePayment(contract.id, p.id), { loading: t("contracts.panels.payments.deleting") });
                        if (res) onChanged?.();
                      }}><FaTrash /></IconButton></Tooltip>
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        ))}
        {payments.length === 0 && <Typography color="text.secondary">{t("contracts.panels.payments.empty")}</Typography>}
      </Stack>
      {dialog && <PaymentDialog dialog={dialog} contractId={contract.id} onClose={() => setDialog(null)} onChanged={onChanged} />}
    </Box>
  );
}

function PaymentDialog({ dialog, contractId, onClose, onChanged }) {
  const { t } = useT();
  const { mode, payment } = dialog;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    amount: payment?.amount ?? "",
    note: payment?.note ?? "",
    status: payment?.status ?? "",
    amountLost: "",
    amountReceived: "",
  });

  async function submit() {
    setErr("");
    let fn;
    if (mode === "create") {
      if (!isPositiveFinite(form.amount)) { setErr(t("contracts.panels.payments.err.amountPositive")); return; }
      fn = () => contractsService.createPayment(contractId, { amount: Number(form.amount), note: form.note });
    } else if (mode === "edit") {
      if (form.amount !== "" && !isPositiveFinite(form.amount)) { setErr(t("contracts.panels.payments.err.amountPositive")); return; }
      fn = () => contractsService.updatePayment(contractId, payment.id, {
        ...(form.amount === "" ? {} : { amount: Number(form.amount) }),
        note: form.note,
      });
    } else if (mode === "status") {
      if (!form.status) { setErr(t("contracts.panels.payments.err.selectStatus")); return; }
      fn = () => contractsService.changePaymentStatus(contractId, payment.id, form.status);
    } else if (mode === "amounts") {
      if (!isNonNegFinite(form.amountLost) || !isNonNegFinite(form.amountReceived)) { setErr(t("contracts.panels.payments.err.amounts")); return; }
      fn = () => contractsService.updatePaymentAmounts(payment.id, {
        ...(form.amountLost === "" ? {} : { amountLost: Number(form.amountLost) }),
        ...(form.amountReceived === "" ? {} : { amountReceived: Number(form.amountReceived) }),
        ...(form.status ? { status: form.status } : {}),
      });
    }
    const res = await runContractMutation(fn, { loading: t("contracts.panels.saving"), setLoading: setBusy });
    if (res) { onChanged?.(); onClose(); }
  }

  const title = {
    create: t("contracts.panels.payments.dialog.add"),
    edit: t("contracts.panels.payments.dialog.edit"),
    status: t("contracts.panels.payments.dialog.status"),
    amounts: t("contracts.panels.payments.dialog.amounts"),
  }[mode];

  return (
    <Dialog open onClose={onClose} dir="rtl" maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Typography color="error" variant="body2">{err}</Typography>}
          {(mode === "create" || mode === "edit") && (
            <>
              <TextField type="number" label={t("contracts.panels.payments.field.amount")} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} fullWidth size="small" />
              <TextField label={t("contracts.panels.payments.field.note")} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} fullWidth size="small" />
            </>
          )}
          {mode === "status" && (
            <TextField select label={t("contracts.panels.payments.field.status")} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth size="small">
              {["NOT_DUE", "DUE", "RECEIVED", "TRANSFERRED", "OVERDUE", "FULLY_PAID", "PENDING", "PARTIALLY_PAID"].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          )}
          {mode === "amounts" && (
            <>
              <TextField type="number" label={t("contracts.panels.payments.field.amountReceived")} value={form.amountReceived} onChange={(e) => setForm({ ...form, amountReceived: e.target.value })} fullWidth size="small" />
              <TextField type="number" label={t("contracts.panels.payments.field.amountLost")} value={form.amountLost} onChange={(e) => setForm({ ...form, amountLost: e.target.value })} fullWidth size="small" />
              <TextField label={t("contracts.panels.payments.field.statusOptional")} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth size="small" />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>{t("contracts.common.cancel")}</Button>
        <Button onClick={submit} variant="contained" disabled={busy}>{t("contracts.common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Drawings ───────────────────────────────────────────────────────────────────────────
export function DrawingsPanel({ contract, onChanged }) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.DRAWING_MANAGE);
  const [dialog, setDialog] = useState(null);
  const drawings = contract?.drawings || [];
  const theme = useTheme();

  return (
    <Box>
      <PanelHeader title={t("contracts.panels.drawings.title")} onAdd={canManage ? () => setDialog({ mode: "create", drawing: { url: "", fileName: "" } }) : undefined} addLabel={t("contracts.panels.drawings.add")} />
      <Grid container spacing={2}>
        {drawings.map((d) => (
          <Grid key={d.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  {d.url && <Box component="img" src={d.url} alt={d.fileName || "drawing"} sx={{ width: "100%", borderRadius: 1, border: `1px solid ${alpha(theme.palette.divider, 0.5)}` }} />}
                  <Typography variant="body2">{d.fileName || t("contracts.panels.drawings.fallbackName")}</Typography>
                  {canManage && (
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton size="small" onClick={() => setDialog({ mode: "edit", drawing: d })}><FaEdit /></IconButton>
                      <IconButton size="small" color="error" onClick={async () => {
                        const res = await runContractMutation(() => contractsService.deleteDrawing(contract.id, d.id), { loading: t("contracts.panels.drawings.deleting") });
                        if (res) onChanged?.();
                      }}><FaTrash /></IconButton>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
        {drawings.length === 0 && <Grid size={12}><Typography color="text.secondary">{t("contracts.panels.drawings.empty")}</Typography></Grid>}
      </Grid>
      {dialog && <DrawingDialog dialog={dialog} contractId={contract.id} onClose={() => setDialog(null)} onChanged={onChanged} />}
    </Box>
  );
}

function DrawingDialog({ dialog, contractId, onClose, onChanged }) {
  const { t } = useT();
  const isCreate = dialog.mode === "create";
  const [form, setForm] = useState({ url: dialog.drawing?.url || "", fileName: dialog.drawing?.fileName || "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (isCreate && !form.url.trim()) { setErr(t("contracts.panels.drawings.err.urlRequired")); return; }
    const fn = isCreate
      ? () => contractsService.createDrawing(contractId, { url: form.url.trim(), fileName: form.fileName })
      : () => contractsService.updateDrawing(contractId, dialog.drawing.id, { ...(form.url.trim() ? { url: form.url.trim() } : {}), fileName: form.fileName });
    const res = await runContractMutation(fn, { loading: t("contracts.panels.saving"), setLoading: setBusy });
    if (res) { onChanged?.(); onClose(); }
  }

  return (
    <Dialog open onClose={onClose} dir="rtl" maxWidth="xs" fullWidth>
      <DialogTitle>{isCreate ? t("contracts.panels.drawings.dialog.add") : t("contracts.panels.drawings.dialog.edit")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Typography color="error" variant="body2">{err}</Typography>}
          <TextField label={t("contracts.panels.drawings.field.url")} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} fullWidth size="small" />
          <TextField label={t("contracts.panels.drawings.field.fileName")} value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} fullWidth size="small" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>{t("contracts.common.cancel")}</Button>
        <Button onClick={submit} variant="contained" disabled={busy}>{t("contracts.common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Special items ────────────────────────────────────────────────────────────────────────
export function SpecialItemsPanel({ contract, onChanged }) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canManage = hasPermission(P.SPECIAL_ITEM_MANAGE);
  const [dialog, setDialog] = useState(null);
  const items = contract?.specialItems || [];

  return (
    <Box>
      <PanelHeader title={t("contracts.panels.special.title")} onAdd={canManage ? () => setDialog({ mode: "create", item: { labelAr: "", labelEn: "" } }) : undefined} addLabel={t("contracts.panels.special.add")} />
      <Stack spacing={1.5}>
        {items.map((it) => (
          <Card key={it.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{it.labelAr}</Typography>
                  {it.labelEn && <Typography variant="caption" color="text.secondary">{it.labelEn}</Typography>}
                </Box>
                {canManage && (
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => setDialog({ mode: "edit", item: it })}><FaEdit /></IconButton>
                    <IconButton size="small" color="error" onClick={async () => {
                      const res = await runContractMutation(() => contractsService.deleteSpecialItem(contract.id, it.id), { loading: t("contracts.panels.special.deleting") });
                      if (res) onChanged?.();
                    }}><FaTrash /></IconButton>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <Typography color="text.secondary">{t("contracts.panels.special.empty")}</Typography>}
      </Stack>
      {dialog && <SpecialItemDialog dialog={dialog} contractId={contract.id} onClose={() => setDialog(null)} onChanged={onChanged} />}
    </Box>
  );
}

function SpecialItemDialog({ dialog, contractId, onClose, onChanged }) {
  const { t } = useT();
  const isCreate = dialog.mode === "create";
  const [form, setForm] = useState({ labelAr: dialog.item?.labelAr || "", labelEn: dialog.item?.labelEn || "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    setErr("");
    if (!form.labelAr.trim()) { setErr(t("contracts.panels.special.err.labelArRequired")); return; }
    const fn = isCreate
      ? () => contractsService.createSpecialItem(contractId, { labelAr: form.labelAr.trim(), labelEn: form.labelEn })
      : () => contractsService.updateSpecialItem(contractId, dialog.item.id, { labelAr: form.labelAr.trim(), labelEn: form.labelEn });
    const res = await runContractMutation(fn, { loading: t("contracts.panels.saving"), setLoading: setBusy });
    if (res) { onChanged?.(); onClose(); }
  }

  return (
    <Dialog open onClose={onClose} dir="rtl" maxWidth="xs" fullWidth>
      <DialogTitle>{isCreate ? t("contracts.panels.special.dialog.add") : t("contracts.panels.special.dialog.edit")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {err && <Typography color="error" variant="body2">{err}</Typography>}
          <TextField label={t("contracts.panels.special.field.labelAr")} value={form.labelAr} onChange={(e) => setForm({ ...form, labelAr: e.target.value })} fullWidth size="small" />
          <TextField label={t("contracts.panels.special.field.labelEn")} value={form.labelEn} onChange={(e) => setForm({ ...form, labelEn: e.target.value })} fullWidth size="small" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={busy}>{t("contracts.common.cancel")}</Button>
        <Button onClick={submit} variant="contained" disabled={busy}>{t("contracts.common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// Divider re-export for the detail page (keeps the panel set self-contained).
export { Divider as PanelDivider };
