"use client";
import { CONTRACT_STATUSES } from "@dms/shared";

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
// Upload helpers (for Drawings)
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput.jsx";
import { FilePreview } from "@/shared/components/utility/Files.jsx";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import {
  buildSessionUrl,
  copyToClipboard,
  generateContractPdfToken,
} from "@/features/contracts/contractSessionLink.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import AddPaymentDialog from "@/features/contracts/payments/AddPaymentDialog.jsx";
import ContractPaymentConditions from "@/features/website-utilities/ContractPaymentConditions.jsx";
import SelectPaymentCondition from "@/features/contracts/payments/SelectPaymentCondition.jsx";
import {
  ConfirmDialog,
  SectionCard,
  RowText,
  AddStageDialog,
  StageRow,
  PaymentRow,
  AddSpecialItemDialog,
  SpecialItemRow,
  AddDrawingDialog,
  DrawingRow,
  isoDateOnly,
} from "@/features/contracts/view/index.js";

/* ===================== Project Group select ===================== */

function ProjectGroupSelect({ clientLeadId, value, onChange, disabled }) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    const req = await getDataAndSet({
      url: `projects/${clientLeadId}/groups`,
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
    arClientName: "",
    enClientName: "",
    startDate: "",
    endDate: "",
    writtenAt: "",
    pdfLinkAr: "",
    pdfLinkEn: "",
    arToken: "",
    enToken: "",
    status: contract?.status || CONTRACT_STATUSES.IN_PROGRESS,
    isCompleted: !!contract?.isCompleted,
    isInProgress: !!contract?.isInProgress,
  });

  useEffect(() => {
    if (contract) {
      setForm({
        title: contract.title || "",
        enTitle: contract.enTitle || "",
        arClientName: contract.clientLead?.client?.arName || "",
        enClientName: contract.clientLead?.client?.enName || "",
        projectGroupId: contract.projectGroupId || "",
        startDate: contract.startDate ? isoDateOnly(contract.startDate) : "",
        endDate: contract.endDate ? isoDateOnly(contract.endDate) : "",
        writtenAt: contract.writtenAt ? isoDateOnly(contract.writtenAt) : "",
        pdfLinkAr: contract.pdfLinkAr || "",
        pdfLinkEn: contract.pdfLinkEn || "",
        arToken: contract.arToken || "",
        enToken: contract.enToken || "",
        status: contract.status || CONTRACT_STATUSES.IN_PROGRESS,
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
    if (
      (form.arClientName || "") !== (contract.clientLead?.client?.arName || "")
    )
      changes.arName = form.arClientName || null;
    if (form.enClientName || "" !== (contract.clientLead?.client?.enName || ""))
      changes.enName = form.enClientName || null;
    return Object.keys(changes).length ? changes : null;
  }, [
    form.title,
    form.enTitle,
    form.projectGroupId,
    contract,
    form.arClientName,
    form.enClientName,
  ]);

  const save = async () => {
    if (!changedPatch) {
      setEdit(false);
      return;
    }

    const req = await handleRequestSubmit(
      changedPatch,
      setToastLoading,
      `contracts/${id}/basics`,
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

  // buildSessionUrl / copyToClipboard now live in the shared contractSessionLink module.

  // Confirmation dialog state
  const [confirm, setConfirm] = useState({ open: false, lang: null });
  const requestGenerate = (lang) => setConfirm({ open: true, lang });
  const closeConfirm = () => setConfirm({ open: false, lang: null });

  const generateSession = async (lang) => {
    closeConfirm();
    const res = await generateContractPdfToken({
      contractId: contract.id,
      lang,
      setLoading,
    });
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
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <FilePreview
                      file={{ url: pdfUrl, name: `${label}.pdf` }}
                    />
                  </Box>
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
                <TextField
                  label="Arabic client name"
                  value={form.arClientName}
                  disabled={!edit}
                  onChange={(e) =>
                    setForm((o) => ({
                      ...o,
                      arClientName: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  placeholder="Enter arabic client name"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="English client name"
                  value={form.enClientName}
                  disabled={!edit}
                  onChange={(e) =>
                    setForm((o) => ({
                      ...o,
                      enClientName: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  placeholder="Enter english client name"
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

function StagesSection({ contract, onReload }) {
  const [openAdd, setOpenAdd] = useState(false);
  const usedTitles = (contract.stages || []).map((s) => s.title);
  const { setLoading } = useToastContext();
  const addStage = async (payload) => {
    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `contracts/${contract.id}/stages`,
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
              taxRate={contract.taxRate || 5}
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

function SpecialItemsSection({ contract, onReload }) {
  const [open, setOpen] = useState(false);
  const { setLoading } = useToastContext();

  const createItem = async (data) => {
    const req = await handleRequestSubmit(
      data,
      setLoading,
      `contracts/${contract.id}/special-items`,
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

function DrawingsSection({ contract, onReload }) {
  const [open, setOpen] = useState(false);
  const { setLoading } = useToastContext();
  const createDrawing = async (data) => {
    const req = await handleRequestSubmit(
      data,
      setLoading,
      `contracts/${contract.id}/drawings`,
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
      url: `contracts/${id}`,
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
              ID #{id}
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
