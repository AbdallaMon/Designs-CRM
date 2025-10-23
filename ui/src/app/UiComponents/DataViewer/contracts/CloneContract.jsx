"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Divider,
  Typography,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  LinearProgress,
  Paper,
  Alert,
  alpha,
  useTheme,
  Grid,
} from "@mui/material";
import {
  FaCopy,
  FaPlus,
  FaTrash,
  FaMoneyBill,
  FaSitemap,
  FaRegImages,
  FaClipboardList,
  FaCheckCircle,
  FaSync,
} from "react-icons/fa";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

import {
  CONTRACT_LEVELSENUM,
  PROJECT_TYPES,
  PROJECT_STATUSES,
  contractLevel,
} from "@/app/helpers/constants";
import SimpleFileInput from "../../formComponents/SimpleFileInput";

/* ----------------- small helpers ----------------- */
const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

/* ----------------- Project Group Select ----------------- */
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
      <FormControl fullWidth disabled={disabled || loading} size="small">
        <InputLabel id="project-group-label">Project Group</InputLabel>
        <Select
          labelId="project-group-label"
          label="Project Group"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {(groups || []).map((g) => (
            <MenuItem key={g.groupId} value={g.groupId}>
              {g.groupTitle} — #{g.groupId}
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

/* ----------------- Stages Selector (same UX as create) ----------------- */
function StagesSelector({ selected, onChange, perStageMeta, setPerStageMeta }) {
  const theme = useTheme();

  const toggleStage = (stg) => {
    const exists = selected.find((s) => s.enum === stg.enum);
    if (exists) {
      onChange(selected.filter((s) => s.enum !== stg.enum));
      const { [stg.enum]: _, ...rest } = perStageMeta || {};
      setPerStageMeta(rest);
    } else {
      onChange([...selected, stg]);
      setPerStageMeta({
        ...perStageMeta,
        [stg.enum]: { deliveryDays: "", deptDeliveryDays: "" },
      });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaClipboardList
          style={{ color: theme.palette.primary.main, fontSize: 20 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Select Stages
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {(CONTRACT_LEVELSENUM || []).map((item) => {
          const active = !!selected.find((s) => s.enum === item.enum);
          return (
            <Chip
              key={item.enum}
              label={`${item.label} (${item.enum})`}
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
              onClick={() => toggleStage(item)}
              icon={active ? <FaCheckCircle /> : undefined}
              sx={{ mb: 1 }}
            />
          );
        })}
      </Stack>

      {selected.length > 0 && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Stage Details
          </Typography>
          <Grid container spacing={2}>
            {selected.map((s, idx) => (
              <Grid key={s.enum} size={{ xs: 12, md: 6 }}>
                <Card
                  variant="outlined"
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.08
                    )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )}`,
                    borderRadius: 2,
                  }}
                >
                  <CardHeader
                    avatar={
                      <Avatar
                        sx={{
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          color: theme.palette.primary.contrastText,
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </Avatar>
                    }
                    title={s.enum}
                    subheader={
                      contractLevel[s.label]?.name ||
                      contractLevel[s.enum]?.name
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 12 }}>
                        <TextField
                          type="number"
                          label="Delivery Days *"
                          value={perStageMeta?.[s.enum]?.deliveryDays ?? ""}
                          onChange={(e) =>
                            setPerStageMeta({
                              ...perStageMeta,
                              [s.enum]: {
                                ...perStageMeta?.[s.enum],
                                deliveryDays: e.target.value,
                              },
                            })
                          }
                          fullWidth
                          required
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          type="number"
                          label="Department Days *"
                          value={perStageMeta?.[s.enum]?.deptDeliveryDays ?? ""}
                          onChange={(e) =>
                            setPerStageMeta({
                              ...perStageMeta,
                              [s.enum]: {
                                ...perStageMeta?.[s.enum],
                                deptDeliveryDays: e.target.value,
                              },
                            })
                          }
                          fullWidth
                          required
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}

/* ----------------- Payments Editor (same UX as create) ----------------- */
function PaymentsEditor({ payments, setPayments, taxRate, setTaxRate }) {
  const theme = useTheme();
  const total = useMemo(
    () => sum(payments.map((p) => Number(p.amount || 0))),
    [payments]
  );
  const tax = useMemo(
    () => ((Number(taxRate) || 0) * total) / 100,
    [taxRate, total]
  );
  const grand = useMemo(() => total + tax, [total, tax]);

  const addPayment = () => setPayments([...payments, { amount: "", note: "" }]);
  const updatePayment = (idx, key, value) => {
    const copy = payments.slice();
    copy[idx] = { ...copy[idx], [key]: value };
    setPayments(copy);
  };
  const removePayment = (idx) => {
    const copy = payments.slice();
    copy.splice(idx, 1);
    setPayments(copy);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaMoneyBill
          style={{ color: theme.palette.success.main, fontSize: 20 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Payments
        </Typography>
        <Box flex={1} />
        <Button
          startIcon={<FaPlus />}
          onClick={addPayment}
          variant="contained"
          size="small"
        >
          Add
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {payments.map((p, idx) => (
          <Grid key={idx} size={{ xs: 12, md: 6 }}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.08
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <CardHeader
                title={`Payment #${idx + 1}`}
                avatar={
                  <Avatar sx={{ bgcolor: "success.main" }}>{idx + 1}</Avatar>
                }
                titleTypographyProps={{ fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid size={{ xs: 12, sm: 12 }}>
                    <TextField
                      type="number"
                      label="Amount"
                      value={p.amount}
                      onChange={(e) =>
                        updatePayment(idx, "amount", e.target.value)
                      }
                      fullWidth
                      required
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      label="Note (Optional)"
                      value={p.note || ""}
                      onChange={(e) =>
                        updatePayment(idx, "note", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid
                    size={{ xs: 12, sm: 1 }}
                    sx={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <Tooltip title="Remove">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => removePayment(idx)}
                          size="small"
                        >
                          <FaTrash />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 1 }} />

      <Paper
        sx={{
          p: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              type="number"
              label="Tax %"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid sm="auto">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Subtotal
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {total.toFixed(2)}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600 }}
                >
                  Tax
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {tax.toFixed(2)}
                </Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "primary.main" }}
                >
                  Total
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    fontSize: "1.1rem",
                  }}
                >
                  {grand.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Stack>
  );
}

/* ----------------- Payment Rules (same logic as create) ----------------- */
function PaymentsRulesEditor({ payments, rules, setRules }) {
  const theme = useTheme();

  const ensureRow = (idx) => {
    if (!rules[idx]) {
      const copy = rules.slice();
      copy[idx] = { projectName: "", condition: "", activateOnSigning: false };
      setRules(copy);
    }
  };

  const setField = (idx, key, value) => {
    ensureRow(idx);
    const copy = rules.slice();
    copy[idx] = { ...copy[idx], [key]: value };

    if (key === "activateOnSigning" && value) {
      copy[idx].projectName = "";
      copy[idx].condition = "";
    }

    if (key === "projectName") {
      const allowed = PROJECT_STATUSES[value] || [];
      if (!allowed.includes(copy[idx].condition)) copy[idx].condition = "";
    }

    setRules(copy);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaClipboardList
          style={{ color: theme.palette.warning.main, fontSize: 20 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Payment Conditions
        </Typography>
      </Stack>

      {payments.length === 0 && (
        <Alert severity="info">
          No payments added. Go back to add payments first.
        </Alert>
      )}

      <Grid container spacing={2}>
        {payments.map((p, idx) => {
          const row = rules[idx] || {};
          const disabled = idx === 0;
          const conds = PROJECT_STATUSES[row.projectName] || [];
          return (
            <Grid size={12} key={idx}>
              <Card
                variant="outlined"
                sx={{
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.warning.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.warning.main, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  borderRadius: 2,
                }}
              >
                <CardHeader
                  title={`Payment #${idx + 1}`}
                  subheader={`Amount: ${Number(p.amount || 0).toFixed(2)}`}
                  avatar={
                    <Avatar sx={{ bgcolor: "warning.main" }}>{idx + 1}</Avatar>
                  }
                  titleTypographyProps={{ fontWeight: 600 }}
                />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {disabled && (
                      <Alert severity="error" icon={<FaCheckCircle />}>
                        This payment will be due after the client signs the
                        contract
                      </Alert>
                    )}
                    <Grid container spacing={2}>
                      <Grid size={{ sm: 6 }}>
                        <FormControl fullWidth disabled={disabled} size="small">
                          <InputLabel id={`proj-${idx}`}>Project</InputLabel>
                          <Select
                            labelId={`proj-${idx}`}
                            label="Project"
                            value={row.projectName || ""}
                            onChange={(e) =>
                              setField(idx, "projectName", e.target.value)
                            }
                          >
                            {(PROJECT_TYPES || []).map((t) => (
                              <MenuItem key={t} value={t}>
                                {t}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ sm: 6 }}>
                        <FormControl
                          fullWidth
                          disabled={
                            disabled || !row.projectName || conds.length === 0
                          }
                          size="small"
                        >
                          <InputLabel id={`cond-${idx}`}>
                            Payment Condition
                          </InputLabel>
                          <Select
                            labelId={`cond-${idx}`}
                            label="Payment Condition"
                            value={row.condition || ""}
                            onChange={(e) =>
                              setField(idx, "condition", e.target.value)
                            }
                          >
                            {conds.map((c) => (
                              <MenuItem key={c} value={c}>
                                {c}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

/* ----------------- Special Items ----------------- */
function SpecialItemsEditor({ items, setItems }) {
  const theme = useTheme();
  const addItem = () => setItems([...items, { labelAr: "", labelEn: "" }]);
  const updateItem = (idx, key, value) => {
    const copy = items.slice();
    copy[idx] = { ...copy[idx], [key]: value };
    setItems(copy);
  };
  const removeItem = (idx) => {
    const copy = items.slice();
    copy.splice(idx, 1);
    setItems(copy);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaSitemap
          style={{ color: theme.palette.secondary.main, fontSize: 20 }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Special Items
        </Typography>
        <Box flex={1} />
        <Button
          startIcon={<FaPlus />}
          onClick={addItem}
          variant="contained"
          size="small"
        >
          Add
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {items.map((it, idx) => (
          <Grid key={idx} size={{ xs: 12, md: 12 }}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.secondary.main,
                  0.08
                )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <CardHeader
                title={`Item #${idx + 1}`}
                avatar={
                  <Avatar sx={{ bgcolor: "secondary.main" }}>{idx + 1}</Avatar>
                }
                titleTypographyProps={{ fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid size={{ sm: 6 }}>
                    <TextField
                      label="Item Name (Arabic) *"
                      value={it.labelAr}
                      onChange={(e) =>
                        updateItem(idx, "labelAr", e.target.value)
                      }
                      fullWidth
                      required
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ sm: 5 }}>
                    <TextField
                      label="Item Name (English)"
                      value={it.labelEn || ""}
                      onChange={(e) =>
                        updateItem(idx, "labelEn", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid
                    size={{ sm: 1 }}
                    sx={{ display: "flex", justifyContent: "flex-end" }}
                  >
                    <Tooltip title="Remove">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => removeItem(idx)}
                          size="small"
                        >
                          <FaTrash />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

/* ----------------- Drawings ----------------- */
function ContractDrawingsEditor({ drawings, setDrawings }) {
  const { setProgress, setOverlay } = useUploadContext();
  const theme = useTheme();

  const addRow = () => setDrawings([...drawings, { url: "", fileName: "" }]);
  const updateRow = (idx, key, value) => {
    const copy = drawings.slice();
    copy[idx] = { ...copy[idx], [key]: value };
    setDrawings(copy);
  };
  const removeRow = (idx) => {
    const copy = drawings.slice();
    copy.splice(idx, 1);
    setDrawings(copy);
  };

  async function handleUploadFile(file, idx) {
    if (file) {
      const res = await uploadInChunks(file, setProgress, setOverlay);
      if (res?.status === 200 && res?.url) {
        const copy = drawings.slice();
        copy[idx] = { ...copy[idx], url: res.url };
        setDrawings(copy);
      }
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaRegImages style={{ color: theme.palette.info.main, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Drawings (Optional)
        </Typography>
        <Box flex={1} />
        <Button
          startIcon={<FaPlus />}
          onClick={addRow}
          variant="contained"
          size="small"
        >
          Add
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {drawings.map((d, idx) => (
          <Grid key={idx} size={{ xs: 12, md: 12 }}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.08
                )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 2,
              }}
            >
              <CardHeader
                title={`Drawing #${idx + 1}`}
                avatar={
                  <Avatar sx={{ bgcolor: "info.main" }}>{idx + 1}</Avatar>
                }
                titleTypographyProps={{ fontWeight: 600 }}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 7 }}>
                      <TextField
                        label="URL"
                        value={d.url}
                        onChange={(e) => updateRow(idx, "url", e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 5 }}>
                      <SimpleFileInput
                        label="File"
                        id={`file-${idx}`}
                        variant="outlined"
                        input={{ accept: "image/*" }}
                        handleUpload={(file) => {
                          handleUploadFile(file, idx);
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="File Name (Optional)"
                    value={d.fileName || ""}
                    onChange={(e) => updateRow(idx, "fileName", e.target.value)}
                    fullWidth
                    size="small"
                  />

                  {d.url && (
                    <Typography variant="caption" color="text.secondary">
                      Will use{" "}
                      {d.url.startsWith("http") ? "URL" : "uploaded file"} when
                      saving.
                    </Typography>
                  )}

                  <Stack direction="row" justifyContent="flex-end">
                    <Tooltip title="Remove">
                      <span>
                        <IconButton
                          color="error"
                          onClick={() => removeRow(idx)}
                          size="small"
                        >
                          <FaTrash />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default function CloneContract({
  sourceId,
  onCloned,
  open,
  setOpen,
  handleCloneClose,
  handleCloneOpen,
}) {
  const theme = useTheme();
  const { setLoading } = useToastContext();

  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Basics", "Payment Terms", "Items & Drawings"];

  // fetched
  const [loadingSrc, setLoadingSrc] = useState(false);
  const [src, setSrc] = useState(null);

  // editable states (default all editable)
  const [clientLeadId, setClientLeadId] = useState(null);
  const [title, setTitle] = useState("");
  const [projectGroup, setProjectGroup] = useState("");

  const [selectedStages, setSelectedStages] = useState([]); // [{enum,label}]
  const [perStageMeta, setPerStageMeta] = useState({}); // { [enum]: {deliveryDays, deptDeliveryDays} }

  const [payments, setPayments] = useState([]); // [{amount, note}]
  const [taxRate, setTaxRate] = useState(0);
  const [paymentRules, setPaymentRules] = useState([]); // align with create

  const [specialItems, setSpecialItems] = useState([]); // [{labelAr,labelEn}]
  const [drawings, setDrawings] = useState([]); // [{url,fileName}]
  useEffect(() => {
    async function fetchCurrent() {
      await getDataAndSet({
        url: `shared/contracts/${sourceId}`,
        setData: (data) => {
          setSrc(data);
        },
        setLoading: setLoadingSrc,
      });
    }
    if (sourceId) {
      fetchCurrent();
    }
  }, [open, sourceId]);

  const handleClose = () => {
    handleCloneClose();
    setActiveStep(0);
  };

  // prefill when src arrives
  useEffect(() => {
    if (!src) return;

    setClientLeadId(src.clientLeadId);
    setTitle((src.title || "").trim());
    setProjectGroup(src.projectGroupId || "");

    // stages → try to map by label to enum in CONTRACT_LEVELSENUM
    const levels = CONTRACT_LEVELSENUM || [];
    const deduced = (src.stages || []).map((s) => {
      const match =
        levels.find((x) => x.label === s.title) ||
        levels.find((x) => x.enum === s.levelEnum);
      return match || { enum: s.title || "LEVEL_1", label: s.title || "Stage" };
    });
    setSelectedStages(deduced);
    const meta = {};
    (src.stages || []).forEach((s) => {
      const match = levels.find((x) => x.label === s.title) ||
        levels.find((x) => x.enum === s.levelEnum) || { enum: s.title };
      meta[match.enum] = {
        deliveryDays: s.deliveryDays ?? "",
        deptDeliveryDays: s.deptDeliveryDays ?? "",
      };
    });
    setPerStageMeta(meta);

    // payments
    const pmts = (src.paymentsNew || []).map((p) => ({
      amount: Number(p.amount || 0),
      note: p.note || "",
      _projectType: p.project?.type || "",
      _condition: p.paymentCondition || "",
    }));
    setPayments(pmts);

    // rules (first payment by signing, others from project/condition if available)
    const rules = pmts.map((p, idx) =>
      idx === 0
        ? { activateOnSigning: true, projectName: "", condition: "" }
        : {
            activateOnSigning: false,
            projectName: p._projectType || "",
            condition: p._condition || "",
          }
    );
    setPaymentRules(rules);

    setTaxRate(Number(src.taxRate || 0));

    setSpecialItems(
      (src.specialItems || []).map((it) => ({
        labelAr: it.labelAr || "",
        labelEn: it.labelEn || "",
      }))
    );

    setDrawings(
      (src.drawings || []).map((d) => ({
        url: d.url || "",
        fileName: d.fileName || "",
      }))
    );
  }, [src]);

  const canGoNext = () => {
    if (activeStep === 0) {
      if (!title.trim()) return false;
      if (!projectGroup) return false;
      if (selectedStages.length === 0) return false;
      for (const s of selectedStages) {
        const dd = perStageMeta?.[s.enum]?.deliveryDays;
        const deptDd = perStageMeta?.[s.enum]?.deptDeliveryDays;
        if (!dd || Number(dd) <= 0) return false;
        if (!deptDd || Number(deptDd) <= 0) return false;
      }
      if (payments.length === 0) return false;
      if (payments.some((p) => !p.amount || Number(p.amount) <= 0))
        return false;
      return true;
    }
    if (activeStep === 1) {
      for (let i = 1; i < payments.length; i++) {
        const r = paymentRules[i] || {};
        if (!r.activateOnSigning) {
          if (!r.projectName || !r.condition) return false;
        }
      }
      return true;
    }
    return true;
  };

  const next = () => {
    if (!canGoNext()) return;
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setActiveStep((s) => Math.max(s - 1, 0));

  // confirm submit
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = async () => {
    // build payload identical to create
    const stagesPayload = selectedStages.map((s, idx) => ({
      title: `${s.label}`,
      levelEnum: s.enum,
      deliveryDays: Number(perStageMeta?.[s.enum]?.deliveryDays || 0),
      deptDeliveryDays: perStageMeta?.[s.enum]?.deptDeliveryDays
        ? Number(perStageMeta[s.enum].deptDeliveryDays)
        : null,
    }));

    const paymentsPayload = payments.map((p, idx) => ({
      amount: Number(p.amount),
      note: p.note || "",
      rule: {
        ...(paymentRules[idx] || {}),
      },
    }));

    const payload = {
      clientLeadId,
      title: title.trim(),
      projectGroupId: projectGroup,
      stages: stagesPayload,
      payments: paymentsPayload,
      taxRate: Number(taxRate || 0),
      specialItems,
      drawings,
      // clone extras:
      oldContractId: sourceId,
      markOldAsCancelled: true,
    };

    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/`,
      false,
      "Creating"
    );

    if (req.status === 200) {
      setConfirmOpen(false);
      handleClose();
      if (typeof onCloned === "function") onCloned();
    }
  };

  return (
    <Box>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.primary.contrastText,
            fontWeight: 700,
            fontSize: "1.2rem",
            p: 2.5,
          }}
        >
          Clone Contract
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ p: 3, bgcolor: alpha(theme.palette.background.paper, 0.8) }}
        >
          {loadingSrc ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <LinearProgress sx={{ width: "100%" }} />
              <Typography variant="caption" sx={{ mt: 1 }}>
                Loading source contract…
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 1 }}>
                {steps.map((label, idx) => (
                  <Step key={label}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          color:
                            idx < activeStep
                              ? "success.main"
                              : idx === activeStep
                              ? "primary.main"
                              : "text.secondary",
                        },
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              {activeStep === 0 && (
                <Stack spacing={3}>
                  <TextField
                    label="Contract Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    fullWidth
                    size="small"
                  />

                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      Project Group
                    </Typography>
                    <ProjectGroupSelect
                      value={projectGroup}
                      onChange={setProjectGroup}
                      clientLeadId={clientLeadId}
                    />
                  </Box>

                  <Divider />

                  <StagesSelector
                    selected={selectedStages}
                    onChange={setSelectedStages}
                    perStageMeta={perStageMeta}
                    setPerStageMeta={setPerStageMeta}
                  />

                  <Divider />

                  <PaymentsEditor
                    payments={payments}
                    setPayments={setPayments}
                    taxRate={taxRate}
                    setTaxRate={setTaxRate}
                  />
                </Stack>
              )}

              {activeStep === 1 && (
                <PaymentsRulesEditor
                  payments={payments}
                  rules={paymentRules}
                  setRules={setPaymentRules}
                />
              )}

              {activeStep === 2 && (
                <Stack spacing={3}>
                  <SpecialItemsEditor
                    items={specialItems}
                    setItems={setSpecialItems}
                  />
                  <Divider />
                  <ContractDrawingsEditor
                    drawings={drawings}
                    setDrawings={setDrawings}
                  />
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            gap: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          <Button
            onClick={handleClose}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep((s) => Math.max(s - 1, 0))}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 && (
            <Button
              onClick={next}
              variant="contained"
              disabled={loadingSrc || !canGoNext()}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Next
            </Button>
          )}
          {activeStep === steps.length - 1 && (
            <Button
              onClick={() => setConfirmOpen(true)}
              variant="contained"
              disabled={loadingSrc}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Create Clone
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* final confirm warning */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Clone</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will create a new contract and mark the old contract (#
            {sourceId}) as
            <strong>&nbsp;CANCELLED</strong>.
          </Alert>
          <Typography variant="body2">
            Continue and send the new data along with the old contract ID?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Back</Button>
          <Button color="error" variant="contained" onClick={handleSubmit}>
            Yes, Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
