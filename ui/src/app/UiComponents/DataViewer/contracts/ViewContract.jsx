"use client";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Divider,
  Button,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
  Grid,
} from "@mui/material";
import {
  FaSync,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash,
  FaBan,
  FaSitemap,
  FaMoneyBill,
  FaRegImages,
  FaClipboardList,
  FaCopy,
  FaPlay,
  FaLink,
  FaStickyNote,
} from "react-icons/fa";
import {
  CONTRACT_LEVELSENUM,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STAGE_STATUS,
  PAYMENT_STATUS_AR,
} from "@/app/helpers/constants";
import { Link as MUILink } from "@mui/material";

// Upload helpers (for Drawings)
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import LoadingOverlay from "../../feedback/loaders/LoadingOverlay";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import AddPaymentDialog from "./AddPaymentDialog";

const canEditStageDays = (stageStatus) =>
  stageStatus === "IN_PROGRESS" || stageStatus === "NOT_STARTED";
const canDeleteStage = (stageStatus) => stageStatus === "NOT_STARTED";

// payments: allow delete only when NOT_DUE or DUE (but not received/transfered)
const canDeletePayment = (status) => status === "NOT_DUE" || status === "DUE";

// tiny diff util so we only send changed fields
function diffPayload(original, changed) {
  const out = {};
  Object.keys(changed).forEach((k) => {
    const a = changed[k];
    const b = original?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out[k] = a;
  });
  return out;
}

function isoDateOnly(v) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ===================== shared confirm dialog ===================== */

function ConfirmDialog({
  open,
  title = "Confirm",
  content,
  onCancel,
  onConfirm,
}) {
  return (
    <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography>{content || "Are you sure?"}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ===================== shell components ===================== */

function SectionCard({ icon, title, subheader, actions, children }) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.03
        )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        borderRadius: 2.5,
      }}
    >
      <Stack sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                fontSize: 24,
                color: "primary.main",
                display: "flex",
                alignItems: "center",
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {subheader && (
                <Typography variant="caption" color="text.secondary">
                  {subheader}
                </Typography>
              )}
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {actions}
          </Stack>
        </Stack>
        {children}
      </Stack>
    </Card>
  );
}

function RowText({ label, value }) {
  return (
    <Stack spacing={0.5} flex={1}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ wordBreak: "break-word", fontWeight: 500 }}
      >
        {value || "—"}
      </Typography>
    </Stack>
  );
}

/* ===================== Project Group select ===================== */

function ProjectGroupSelect({ clientLeadId, value, onChange, disabled }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    await getDataAndSet({
      url: `shared/client-leads/${clientLeadId}/projects/groups`,
      setData: setGroups,
      setLoading,
    });
  };

  useEffect(() => {
    if (clientLeadId) fetchGroups();
  }, [clientLeadId]);

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end" flex={1}>
      <FormControl fullWidth disabled={disabled || loading}>
        <InputLabel id="project-group-label">Project Group</InputLabel>
        <Select
          labelId="project-group-label"
          label="Project Group"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {groups.map((group) => (
            <MenuItem key={group.groupId} value={group.groupId}>
              {group.groupTitle} — #{group.groupId}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Tooltip title="Reload groups">
        <span>
          <IconButton
            onClick={fetchGroups}
            disabled={loading || disabled}
            size="small"
          >
            {loading ? (
              <LinearProgress sx={{ width: 24 }} />
            ) : (
              <FaSync style={{ color: theme.palette.text.secondary }} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

function ContractBasics({ id, contract, onReload }) {
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setLoading: setToastLoading } = useToastContext();
  // Editable slice only (everything else displays as text)
  const [form, setForm] = useState({
    title: "",
    projectGroupId: "",
    enTitle: "",
    // read-only preview fields:
    startDate: "",
    endDate: "",
    writtenAt: "",
    pdfLinkAr: "",
    pdfLinkEn: "",
    arToken: "",
    enToken: "",
    status: contract?.status || "IN_PROGRESS",
    isCompleted: !!contract?.isCompleted,
    isInProgress: !!contract?.isInProgress,
  });

  useEffect(() => {
    if (contract) {
      setForm({
        title: contract.title || "",
        enTitle: contract.enTitle || "",
        projectGroupId: contract.projectGroupId || "",
        startDate: contract.startDate ? isoDateOnly(contract.startDate) : "",
        endDate: contract.endDate ? isoDateOnly(contract.endDate) : "",
        writtenAt: contract.writtenAt ? isoDateOnly(contract.writtenAt) : "",
        pdfLinkAr: contract.pdfLinkAr || "",
        pdfLinkEn: contract.pdfLinkEn || "",
        arToken: contract.arToken || "",
        enToken: contract.enToken || "",
        status: contract.status || "IN_PROGRESS",
        isCompleted: !!contract.isCompleted,
        isInProgress: !!contract.isInProgress,
      });
    }
  }, [contract]);

  // Only allow save when editable fields changed
  const changedPatch = useMemo(() => {
    if (!contract) return null;
    const changes = {};
    if ((form.title || "") !== (contract.title || ""))
      changes.title = form.title || null;
    if ((form.enTitle || "") !== (contract.enTitle || ""))
      changes.enTitle = form.enTitle || null;
    if ((form.projectGroupId || "") !== (contract.projectGroupId || ""))
      changes.projectGroupId = form.projectGroupId || null;

    return Object.keys(changes).length ? changes : null;
  }, [form.title, form.enTitle, form.projectGroupId, contract]);

  const save = async () => {
    if (!changedPatch) {
      setEdit(false);
      return;
    }

    const req = await handleRequestSubmit(
      changedPatch,
      setToastLoading,
      `shared/contracts/${id}/basics`,
      false,
      "Updating",
      false,
      "PUT"
    );
    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  // Build session URL exactly as requested (don't change it)
  const buildSessionUrl = (token) => {
    if (!token) return "";

    if (typeof window === "undefined") return ""; // prevent server-side errors

    const { origin, pathname } = window.location;
    // Example: http://dreamstudio.com/page → origin=http://dreamstudio.com, pathname=/page

    // Construct full URL preserving current path before /contracts
    return `${origin}/contracts?token=${encodeURIComponent(token)}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, lang: null });
  const requestGenerate = (lang) => setConfirm({ open: true, lang });
  const closeConfirm = () => setConfirm({ open: false, lang: null });

  const generateSession = async (lang) => {
    closeConfirm();
    const res = await handleRequestSubmit(
      { lang },
      setLoading,
      `shared/contracts/${contract.id}`,
      false,
      "Generating",
      false,
      "PATCH"
    );
    if (res?.status === 200) onReload();
  };

  // Small block to show a PDF link with copy + session actions
  const PdfBlock = ({ label, pdfUrl, token, onGenerate }) => {
    const sessionUrl = buildSessionUrl(token);
    return (
      <Card
        variant="outlined"
        sx={{
          borderRadius: 2,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={label}
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "text.secondary",
                }}
              >
                PDF URL
              </Typography>
              {pdfUrl ? (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{ mt: 1 }}
                >
                  <MUILink
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener"
                    sx={{ fontSize: "0.875rem", wordBreak: "break-all" }}
                  >
                    {pdfUrl}
                  </MUILink>
                  <Tooltip title="Copy PDF link">
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(pdfUrl)}
                      sx={{ ml: "auto" }}
                    >
                      <FaCopy size={14} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  —
                </Typography>
              )}
            </Box>

            <Divider />

            <Stack spacing={1.5}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FaPlay size={12} />}
                onClick={onGenerate}
                fullWidth
              >
                Generate Session
              </Button>

              {token ? (
                <Fragment>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<FaCopy size={12} />}
                    onClick={() => copyToClipboard(sessionUrl)}
                    fullWidth
                  >
                    Copy Session Link
                  </Button>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
                      p: 1,
                      bgcolor: "action.hover",
                      borderRadius: 1,
                    }}
                  >
                    <FaLink size={12} style={{ flexShrink: 0 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ wordBreak: "break-all" }}
                    >
                      {sessionUrl}
                    </Typography>
                  </Stack>
                </Fragment>
              ) : (
                <Chip label="No session yet" size="small" variant="outlined" />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <SectionCard
      icon={<FaSitemap />}
      title="Contract"
      subheader={`ID #${id}`}
      actions={
        <Stack direction="row" spacing={0.5}>
          {edit ? (
            <Fragment>
              <Tooltip title={changedPatch ? "Save" : "No changes"}>
                <span>
                  <IconButton
                    color="primary"
                    onClick={save}
                    disabled={!changedPatch || loading}
                    size="small"
                  >
                    <FaSave />
                  </IconButton>
                </span>
              </Tooltip>
              <IconButton
                color="error"
                onClick={() => setEdit(false)}
                size="small"
              >
                <FaTimes />
              </IconButton>
            </Fragment>
          ) : (
            <IconButton onClick={() => setEdit(true)} size="small">
              <FaEdit />
            </IconButton>
          )}
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        {/* Basics (editable) */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            backgroundColor: alpha("#fff", 0.5),
          }}
        >
          <CardHeader
            title="Basics"
            titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Arabic contract type"
                  fullWidth
                  value={form.title}
                  onChange={(e) =>
                    setForm((o) => ({ ...o, title: e.target.value }))
                  }
                  disabled={!edit}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="English contract type"
                  fullWidth
                  value={form.enTitle}
                  onChange={(e) =>
                    setForm((o) => ({ ...o, enTitle: e.target.value }))
                  }
                  disabled={!edit}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ProjectGroupSelect
                  clientLeadId={contract?.clientLeadId}
                  value={form.projectGroupId}
                  onChange={(v) =>
                    setForm((o) => ({ ...o, projectGroupId: v }))
                  }
                  disabled={!edit}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Dates & read-only preview */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            backgroundColor: alpha("#fff", 0.5),
          }}
        >
          <CardHeader
            title="Dates & Status"
            titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <RowText label="Start Date" value={form.startDate || "—"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <RowText label="End Date" value={form.endDate || "—"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <RowText label="Written At" value={form.writtenAt || "—"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <RowText label="Status" value={form.status} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* PDFs & Sessions */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PdfBlock
              label="PDF (AR)"
              pdfUrl={form.pdfLinkAr}
              token={form.arToken}
              onGenerate={() => requestGenerate("ar")}
            />
          </Grid>
          {form.pdfLinkAr && (
            <Grid size={{ xs: 12, md: 6 }}>
              <PdfBlock
                label="PDF (EN)"
                pdfUrl={form.pdfLinkEn}
                token={form.enToken}
                onGenerate={() => requestGenerate("en")}
              />
            </Grid>
          )}
        </Grid>
      </Stack>

      <ConfirmDialog
        open={confirm.open}
        onCancel={closeConfirm}
        onConfirm={() => generateSession(confirm.lang)}
        title="Generate a session link"
        content={`Are you sure you want to generate a new session link?`}
      />
    </SectionCard>
  );
}

/* ===================== Stages ===================== */

function AddStageDialog({ open, onClose, onAdd, usedTitles = [] }) {
  const [level, setLevel] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [deptDeliveryDays, setDeptDeliveryDays] = useState("");
  const options = (CONTRACT_LEVELSENUM || [])
    .filter((o) => !usedTitles?.includes(o.enum))
    .map((o) => ({ value: o.enum, label: `${o.label} (${o.enum})` }));

  const canSave =
    level && Number(deliveryDays) > 0 && Number(deptDeliveryDays) > 0;

  const handleSave = () => {
    const picked = (CONTRACT_LEVELSENUM || []).find((x) => x.enum === level);
    onAdd({
      title: picked?.label,
      levelEnum: picked?.enum,
      deliveryDays: Number(deliveryDays),
      deptDeliveryDays: Number(deptDeliveryDays),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Add Stage</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Level</InputLabel>
            <Select
              label="Level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {options.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="number"
            label="Delivery Days"
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(e.target.value)}
            size="small"
          />
          <TextField
            type="number"
            label="Department Days"
            value={deptDeliveryDays}
            onChange={(e) => setDeptDeliveryDays(e.target.value)}
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StageRow({ stage, onReload, contractId }) {
  const theme = useTheme();
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    deliveryDays: stage.deliveryDays || 0,
    deptDeliveryDays: stage.deptDeliveryDays || 0,
  });
  const { setLoading } = useToastContext();

  useEffect(() => {
    setForm({
      deliveryDays: stage.deliveryDays || 0,
      deptDeliveryDays: stage.deptDeliveryDays || 0,
    });
  }, [stage.id, stage.deliveryDays, stage.deptDeliveryDays]);

  const save = async () => {
    const payload = diffPayload(
      {
        deliveryDays: stage.deliveryDays,
        deptDeliveryDays: stage.deptDeliveryDays,
      },
      form
    );
    if (Object.keys(payload).length === 0) {
      setEdit(false);
      return;
    }
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/${contractId}/stages/${stage.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  const remove = async () => {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/contracts/${contractId}/stages/${stage.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  const editable = canEditStageDays(stage.stageStatus);
  const deletable = canDeleteStage(stage.stageStatus);

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={stage.title}
          subheader={`Status: ${
            STAGE_STATUS[stage.stageStatus] || stage.stageStatus
          }`}
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          action={
            <Stack direction="row" spacing={0.5}>
              {edit ? (
                <>
                  <IconButton color="primary" onClick={save} size="small">
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setEdit(false)}
                    size="small"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  onClick={() => editable && setEdit(true)}
                  disabled={!editable}
                  size="small"
                  title={editable ? "Edit" : "Locked when completed"}
                >
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => deletable && setConfirmOpen(true)}
                disabled={!deletable}
                size="small"
                title={deletable ? "Delete" : "Only deletable if not started"}
              >
                <FaTrash />
              </IconButton>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Delivery Days"
                type="number"
                value={form.deliveryDays}
                onChange={(e) =>
                  setForm((o) => ({
                    ...o,
                    deliveryDays: Number(e.target.value),
                  }))
                }
                disabled={!edit}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Department Days"
                type="number"
                value={form.deptDeliveryDays}
                onChange={(e) =>
                  setForm((o) => ({
                    ...o,
                    deptDeliveryDays: Number(e.target.value),
                  }))
                }
                disabled={!edit}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await remove();
          setConfirmOpen(false);
        }}
        title="Delete Stage"
        content={`Delete stage "${stage.title}"? This action cannot be undone.`}
      />
    </>
  );
}

function StagesSection({ contract, onReload }) {
  const [openAdd, setOpenAdd] = useState(false);
  const usedTitles = (contract.stages || []).map((s) => s.title);
  const { setLoading } = useToastContext();
  const addStage = async (payload) => {
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/${contract.id}/stages`,
      false,
      "Adding",
      false
    );

    if (req.status === 200) {
      setOpenAdd(false);
      await onReload();
    }
  };

  return (
    <SectionCard
      icon={<FaClipboardList />}
      title="Stages"
      subheader={`Count: ${contract.stages?.length || 0}`}
      actions={
        <Button
          startIcon={<FaPlus />}
          onClick={() => setOpenAdd(true)}
          size="small"
          variant="contained"
        >
          Add
        </Button>
      }
    >
      <Stack spacing={2}>
        <Grid container spacing={2}>
          {(contract.stages || [])
            .sort((a, b) => a.order - b.order)
            .map((st) => (
              <Grid key={st.id} size={{ xs: 12, md: 6 }}>
                <StageRow
                  stage={st}
                  onReload={onReload}
                  contractId={contract.id}
                />
              </Grid>
            ))}
        </Grid>
      </Stack>

      <AddStageDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onAdd={addStage}
        usedTitles={usedTitles}
      />
    </SectionCard>
  );
}

/* ===================== Payments ===================== */

function PaymentRow({ payment, contractId, onReload }) {
  const theme = useTheme();
  const relatedType = payment?.project?.type || "";
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { setLoading } = useToastContext();
  // status: preview + independent update
  const [status, setStatus] = useState(payment.status);

  // Working state (unchanged)
  const [amount, setAmount] = useState(Number(payment.amount) || 0);
  const [chosenType, setChosenType] = useState(relatedType || "");
  const [condition, setCondition] = useState(payment.paymentCondition || "");

  const conditionIsSignature =
    ((condition || "") + "").toUpperCase() === "SIGNATURE";

  useEffect(() => {
    setAmount(Number(payment.amount) || 0);
    setChosenType(relatedType || "");
    setCondition(payment.paymentCondition || "");
    setStatus(payment.status);
  }, [
    payment.id,
    relatedType,
    payment.amount,
    payment.paymentCondition,
    payment.status,
  ]);

  // === NEW: independent request for status ===
  const updateStatus = async (next) => {
    // guard: allow only RECEIVED or TRANSFERRED
    if (next !== "RECEIVED" && next !== "TRANSFERRED") return;

    const req = await handleRequestSubmit(
      { status: next },
      setLoading,
      `shared/contracts/${contractId}/payments/${payment.id}/status`,
      false,
      "Updating",
      false
    );

    if (req.status === 200) {
      setStatus(next);
      await onReload();
      oad();
    }
  };

  const save = async () => {
    const payload = diffPayload(
      {
        amount: Number(payment.amount) || 0,
        paymentCondition: payment.paymentCondition || "",
        projectType: relatedType || "",
      },
      {
        amount,
        paymentCondition: condition,
        projectType: chosenType,
      }
    );

    if (conditionIsSignature && "paymentCondition" in payload) {
      delete payload.paymentCondition;
    }

    if (Object.keys(payload).length === 0) {
      setEdit(false);
      return;
    }
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/${contractId}/payments/${payment.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  const remove = async () => {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/contracts/${contractId}/payments/${payment.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  const deletable = canDeletePayment(payment.status);

  const typeList = PROJECT_TYPES || [];
  const statusList = chosenType ? PROJECT_STATUSES[chosenType] || [] : [];
  // color for Chip preview
  const statusColor =
    status === "RECEIVED"
      ? "success"
      : status === "TRANSFERRED"
      ? "info"
      : status === "DUE"
      ? "warning"
      : "default";

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.success.main,
            0.08
          )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={`Payment • ${Number(payment.amount)}`}
          subheader={
            <>
              {payment.project
                ? `Project: ${payment.project.type}`
                : `No related project`}
              <br />
              {payment.note}
            </>
          }
          action={
            <Stack direction="row" spacing={0.5}>
              {edit ? (
                <>
                  <IconButton color="primary" onClick={save} size="small">
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setEdit(false)}
                    size="small"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => setEdit(true)} size="small">
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => deletable && setConfirmOpen(true)}
                disabled={!deletable}
                size="small"
                title={
                  deletable
                    ? "Delete payment"
                    : "Only deletable when Not Due or Due"
                }
              >
                <FaTrash />
              </IconButton>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            {/* === NEW: Status Select (independent request) === */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Chip label={status} color={statusColor} variant="filled" />
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Payment Status</InputLabel>
                <Select
                  label="Payment Status"
                  value={status}
                  onChange={(e) => updateStatus(e.target.value)}
                  size="small"
                >
                  {/* Only allowed targets */}
                  <MenuItem value="RECEIVED">RECEIVED</MenuItem>
                  <MenuItem value="TRANSFERRED">TRANSFERRED</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            {/* Amount (unchanged) */}
            <TextField
              type="number"
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={!edit}
              fullWidth
              size="small"
            />

            {!conditionIsSignature && (
              <Stack spacing={1}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Project Type
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {typeList.map((t) => {
                    const active = chosenType === t;
                    return (
                      <Chip
                        key={t}
                        label={t}
                        color={active ? "primary" : "default"}
                        variant={active ? "filled" : "outlined"}
                        onClick={() => {
                          if (!edit) return;
                          setChosenType(t);
                          const nextList = PROJECT_STATUSES[t] || [];
                          if (!nextList.includes(condition)) setCondition("");
                        }}
                        disabled={!edit}
                        sx={{ cursor: !edit ? "default" : "pointer" }}
                      />
                    );
                  })}
                </Stack>
              </Stack>
            )}

            {/* Condition select (unchanged) */}
            {!conditionIsSignature && (
              <FormControl
                fullWidth
                disabled={!edit || conditionIsSignature || !chosenType}
                size="small"
              >
                <InputLabel>Payment Condition</InputLabel>
                <Select
                  label="Payment Condition"
                  value={condition || ""}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  {(statusList || []).map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {conditionIsSignature && (
              <Typography variant="caption" color="text.secondary">
                Condition is "Signature" — it cannot be changed.
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await remove();
          setConfirmOpen(false);
        }}
        title="Delete Payment"
        content={`Delete this payment of ${Number(
          payment.amount
        )}? You can only delete NOT_DUE or DUE payments.`}
      />
    </>
  );
}

function PaymentsSection({ contract, onReload }) {
  const [openAdd, setOpenAdd] = useState(false);

  return (
    <>
      <SectionCard
        icon={<FaMoneyBill />}
        title="Payments"
        subheader={`Count: ${contract.paymentsNew?.length || 0}`}
        actions={
          <Button
            startIcon={<FaPlus />}
            onClick={() => setOpenAdd(true)}
            size="small"
            variant="contained"
          >
            Add
          </Button>
        }
      >
        <Stack spacing={2}>
          {(contract.paymentsNew || []).map((p) => (
            <PaymentRow
              key={p.id}
              payment={p}
              contractId={contract.id}
              onReload={onReload}
            />
          ))}
        </Stack>
      </SectionCard>

      <AddPaymentDialog
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        contractId={contract.id}
        onCreated={onReload}
      />
    </>
  );
}
/* ===================== Special Items ===================== */

function AddSpecialItemDialog({ open, onClose, onCreate }) {
  const [labelAr, setLabelAr] = useState("");
  const [labelEn, setLabelEn] = useState("");
  useEffect(() => {
    if (open) {
      setLabelAr("");
      setLabelEn("");
    }
  }, [open]);

  const canSave = !!labelAr.trim();

  const save = async () => {
    await onCreate({ labelAr: labelAr.trim(), labelEn: labelEn.trim() || "" });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Add Special Item</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <TextField
            label="Item Name (Arabic) *"
            value={labelAr}
            onChange={(e) => setLabelAr(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Item Name (English) (Optional)"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={!canSave} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SpecialItemRow({ item, contractId, onReload }) {
  const theme = useTheme();
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    labelAr: item.labelAr,
    labelEn: item.labelEn || "",
  });

  const { setLoading } = useToastContext();
  useEffect(() => {
    setForm({ labelAr: item.labelAr, labelEn: item.labelEn || "" });
  }, [item.id, item.labelAr, item.labelEn]);

  const save = async () => {
    const payload = diffPayload(
      { labelAr: item.labelAr, labelEn: item.labelEn || "" },
      form
    );
    if (Object.keys(payload).length === 0) return setEdit(false);
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/${contractId}/special-items/${item.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  const remove = async () => {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/contracts/${contractId}/special-items/${item.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.warning.main,
            0.05
          )} 0%, ${alpha(theme.palette.warning.main, 0.01)} 100%)`,
          borderRadius: 2,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={item.labelAr}
          subheader={item.labelEn || "No English translation"}
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          action={
            <Stack direction="row" spacing={0.5}>
              {edit ? (
                <>
                  <IconButton color="primary" onClick={save} size="small">
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setEdit(false)}
                    size="small"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => setEdit(true)} size="small">
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => setConfirmOpen(true)}
                size="small"
              >
                <FaTrash />
              </IconButton>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Item Name (Arabic)"
                value={form.labelAr}
                onChange={(e) =>
                  setForm((o) => ({ ...o, labelAr: e.target.value }))
                }
                disabled={!edit}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Item Name (English)"
                value={form.labelEn}
                onChange={(e) =>
                  setForm((o) => ({ ...o, labelEn: e.target.value }))
                }
                disabled={!edit}
                fullWidth
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await remove();
          setConfirmOpen(false);
        }}
        title="Delete Special Item"
        content={`Delete special item "${item.labelAr}"? This action cannot be undone.`}
      />
    </>
  );
}

function SpecialItemsSection({ contract, onReload }) {
  const [open, setOpen] = useState(false);
  const { setLoading } = useToastContext();

  const createItem = async (data) => {
    const req = await handleRequestSubmit(
      data,
      setLoading,
      `shared/contracts/${contract.id}/special-items`,
      false,
      "Updating",
      false,
      "POST"
    );

    if (req.status === 200) {
      setOpen(false);
      await onReload();
    }
  };

  return (
    <SectionCard
      icon={<FaSitemap />}
      title="Special Items"
      subheader={`Count: ${contract.specialItems?.length || 0}`}
      actions={
        <Button
          startIcon={<FaPlus />}
          onClick={() => setOpen(true)}
          size="small"
          variant="contained"
        >
          Add
        </Button>
      }
    >
      <Stack spacing={2}>
        {(contract.specialItems || []).map((it) => (
          <SpecialItemRow
            key={it.id}
            item={it}
            contractId={contract.id}
            onReload={onReload}
          />
        ))}
      </Stack>

      <AddSpecialItemDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createItem}
      />
    </SectionCard>
  );
}

/* ===================== Drawings ===================== */

function AddDrawingDialog({ open, onClose, onCreate }) {
  const { setProgress, setOverlay } = useUploadContext();
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (open) {
      setUrl("");
      setFileName("");
    }
  }, [open]);

  const handleUpload = async (file) => {
    if (!file) return;
    const res = await uploadInChunks(file, setProgress, setOverlay);
    if (res?.status === 200 && res?.url) setUrl(res.url);
  };

  const canSave = !!url.trim();

  const save = async () => {
    await onCreate({ url: url.trim(), fileName: fileName.trim() || "" });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 600 }}>Add Drawing</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 2 }}>
          <TextField
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            size="small"
          />
          <SimpleFileInput
            label="File"
            id="drawing-file"
            variant="outlined"
            handleUpload={handleUpload}
            input={{ accept: "image/*" }}
          />
          <TextField
            label="File Name (Optional)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            fullWidth
            size="small"
          />
          {!!url && (
            <Typography variant="caption" color="text.secondary">
              Will use {url.startsWith("http") ? "URL" : "uploaded file"} when
              saving.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={save} disabled={!canSave} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DrawingRow({ row, contractId, onReload }) {
  const theme = useTheme();
  const { setProgress, setOverlay } = useUploadContext();
  const [edit, setEdit] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    url: row.url,
    fileName: row.fileName || "",
  });
  const { setLoading } = useToastContext();

  useEffect(() => {
    setForm({ url: row.url, fileName: row.fileName || "" });
  }, [row.id, row.url, row.fileName]);

  const save = async () => {
    const payload = diffPayload(
      { url: row.url, fileName: row.fileName || "" },
      form
    );
    if (Object.keys(payload).length === 0) return setEdit(false);
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/${contractId}/drawings/${row.id}`,
      false,
      "Updating",
      false,
      "PUT"
    );

    if (req.status === 200) {
      setEdit(false);
      await onReload();
    }
  };

  const remove = async () => {
    const req = await handleRequestSubmit(
      {},
      setLoading,
      `shared/contracts/${contractId}/drawings/${row.id}`,
      false,
      "Updating",
      false,
      "DELETE"
    );

    if (req.status === 200) {
      await onReload();
    }
  };

  const uploadReplace = async (file) => {
    if (!file) return;
    const res = await uploadInChunks(file, setProgress, setOverlay);
    if (res?.status === 200 && res?.url) {
      setForm((o) => ({ ...o, url: res.url }));
    }
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.info.main,
            0.05
          )} 0%, ${alpha(theme.palette.info.main, 0.01)} 100%)`,
          borderRadius: 2,
          "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
          transition: "all 0.3s ease",
        }}
      >
        <CardHeader
          title={row.fileName || "Drawing"}
          subheader={row.url}
          titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
          action={
            <Stack direction="row" spacing={0.5}>
              {edit ? (
                <>
                  <IconButton color="primary" onClick={save} size="small">
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => setEdit(false)}
                    size="small"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <IconButton onClick={() => setEdit(true)} size="small">
                  <FaEdit />
                </IconButton>
              )}
              <IconButton
                color="error"
                onClick={() => setConfirmOpen(true)}
                size="small"
              >
                <FaTrash />
              </IconButton>
            </Stack>
          }
        />
        <Divider />
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="URL"
              value={form.url}
              onChange={(e) => setForm((o) => ({ ...o, url: e.target.value }))}
              disabled={!edit}
              fullWidth
              size="small"
            />
            {edit && (
              <SimpleFileInput
                label="Replace File"
                id={`file-${row.id}`}
                variant="outlined"
                handleUpload={uploadReplace}
                input={{ accept: "image/*" }}
              />
            )}
            <TextField
              label="File Name (Optional)"
              value={form.fileName}
              onChange={(e) =>
                setForm((o) => ({ ...o, fileName: e.target.value }))
              }
              disabled={!edit}
              fullWidth
              size="small"
            />
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          await remove();
        }}
        title="Delete Drawing"
        content={`Delete drawing "${
          row.fileName || row.url
        }"? This action cannot be undone.`}
      />
    </>
  );
}

function DrawingsSection({ contract, onReload }) {
  const [open, setOpen] = useState(false);
  const { setLoading } = useToastContext();
  const createDrawing = async (data) => {
    const req = await handleRequestSubmit(
      data,
      setLoading,
      `shared/contracts/${contract.id}/drawings`,
      false,
      "Updating",
      false,
      "POST"
    );

    if (req.status === 200) {
      setOpen(false);
      await onReload();
    }
  };

  return (
    <SectionCard
      icon={<FaRegImages />}
      title="Drawings / Files"
      subheader={`Count: ${contract.drawings?.length || 0}`}
      actions={
        <Button
          startIcon={<FaPlus />}
          onClick={() => setOpen(true)}
          size="small"
          variant="contained"
        >
          Add
        </Button>
      }
    >
      <Stack spacing={2}>
        {(contract.drawings || []).map((d) => (
          <DrawingRow
            key={d.id}
            row={d}
            contractId={contract.id}
            onReload={onReload}
          />
        ))}
      </Stack>

      <AddDrawingDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreate={createDrawing}
      />
    </SectionCard>
  );
}

/* ===================== Main ===================== */

export default function ViewContract({ id, hide, updateOuterContract }) {
  const theme = useTheme();
  const [contract, setContract] = useState({});
  const [loading, setLoading] = useState(true);

  async function fetchContractDetails() {
    const req = await getDataAndSet({
      url: `shared/contracts/${id}`,
      setLoading,
      setData: setContract,
    });
    if (updateOuterContract) {
      updateOuterContract(req.data);
    }
  }

  useEffect(() => {
    if (id) fetchContractDetails();
  }, [id]);

  if (!contract && !loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography color="error">Failed to load contract.</Typography>
          <IconButton onClick={fetchContractDetails}>
            <FaSync />
          </IconButton>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2.5,
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.02
        )} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
      }}
    >
      {loading && <LoadingOverlay />}
      <Stack spacing={3}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              Contract Viewer / Editor
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID #${id}
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Chip
              label={`Status: ${contract?.status || "—"}`}
              variant="outlined"
              color="primary"
            />
            <Chip
              label={`Stages: ${contract?.stages?.length || 0}`}
              variant="outlined"
            />
            <Chip
              label={`Payments: ${contract?.paymentsNew?.length || 0}`}
              variant="outlined"
            />
            <Tooltip title="Reload contract">
              <IconButton
                onClick={fetchContractDetails}
                size="small"
                sx={{
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <FaSync />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={3}>
          {hide?.basics ? null : (
            <ContractBasics
              id={contract.id}
              contract={contract}
              onReload={fetchContractDetails}
            />
          )}
          <StagesSection contract={contract} onReload={fetchContractDetails} />
          <PaymentsSection
            contract={contract}
            onReload={fetchContractDetails}
          />
          {hide?.specialItems ? null : (
            <SpecialItemsSection
              contract={contract}
              onReload={fetchContractDetails}
            />
          )}
          {hide?.drawings ? null : (
            <DrawingsSection
              contract={contract}
              onReload={fetchContractDetails}
            />
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
