"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Stack,
  Typography,
  IconButton,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  LinearProgress,
  Avatar,
  Alert,
  Grid,
  Paper,
  alpha,
  useTheme,
} from "@mui/material";
import {
  FaPlus,
  FaTrash,
  FaSync,
  FaMoneyBill,
  FaSitemap,
  FaRegImages,
  FaClipboardList,
  FaUpload,
  FaCheckCircle,
} from "react-icons/fa";
import {
  CONTRACT_LEVELSENUM,
  contractLevel,
  PROJECT_STATUSES,
  PROJECT_TYPES,
} from "@/app/helpers/constants";
import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import SimpleFileInput from "../../formComponents/SimpleFileInput";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import SelectPaymentCondition from "./payments/SelectPaymentCondition";

// Sum helper
const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

// --- Project Group Select ---

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
    fetchGroups();
  }, []);

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end" flex={1}>
      <FormControl fullWidth disabled={loading}>
        <InputLabel id="project-group-label">Project Group</InputLabel>
        <Select
          labelId="project-group-label"
          label="Project Group"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          size="small"
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

// --- Stages Selector ---

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
        [stg.enum]: {
          deliveryDays: "",
          deptDeliveryDays: "",
        },
      });
    }
  };

  const ordered = selected;

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
        {CONTRACT_LEVELSENUM.map((item) => {
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

      {ordered.length > 0 && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Stage Details
          </Typography>
          <Grid container spacing={2}>
            {ordered.map((s, idx) => (
              <Grid key={s.enum} size={{ md: 6 }}>
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
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                    transition: "all 0.3s ease",
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
                    titleTypographyProps={{ fontWeight: 600 }}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ sm: 6 }}>
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
                      <Grid size={{ sm: 6 }}>
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

// --- Payments Editor ---

function PaymentsEditor({ payments, setPayments, taxRate = 5 }) {
  const theme = useTheme();
  const total = useMemo(() => sum(payments.map((p) => p.amount)), [payments]);
  const tax = useMemo(
    () => ((Number(taxRate) || 0) * total) / 100,
    [taxRate, total]
  );
  const grand = useMemo(() => total + tax, [total, tax]);

  const addPayment = () => {
    setPayments([
      ...payments,
      {
        amount: "",
        note: "",
        condition: payments?.length === 0 ? "SIGNATURE" : "",
        type: "",
        conditionId: null,
        conditionItem: null,
      },
    ]);
  };

  const updatePayment = (idx, key, value) => {
    const copy = payments.slice();
    copy[idx] = { ...copy[idx], [key]: value };
    setPayments(copy);
  };

  const updatePaymentFields = (idx, newData) => {
    const copy = payments.slice();
    copy[idx] = { ...copy[idx], ...newData };
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
          <Grid key={idx}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.success.main,
                  0.08
                )} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                borderRadius: 2,
                "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                transition: "all 0.3s ease",
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
                  <Grid size={{ sm: 6 }}>
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
                  <Grid size={{ sm: 6 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 1 }}>
                      Amount with Tax:
                      {(
                        Number(p.amount || 0) *
                        (1 + (Number(taxRate) || 0) / 100)
                      ).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid size={{ sm: 10 }}>
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
                    size={{ sm: 2 }}
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
                  <Grid size={12}>
                    {idx === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        This payment will be due after the client signs the
                        contract.
                      </Typography>
                    ) : (
                      <SelectPaymentCondition
                        initialCondition={p.conditionItem}
                        onConditionChange={(value) => {
                          updatePaymentFields(idx, {
                            condition: value.condition,
                            type: value.conditionType,
                            conditionId: value.id,
                            conditionItem: value,
                          });
                        }}
                      />
                    )}
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

// --- Payments Rules Editor ---

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
          No payments added. Go back to the previous step to add payments.
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
                  "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                  transition: "all 0.3s ease",
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
                            {PROJECT_TYPES.map((t) => (
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

// --- Special Items Editor ---

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
          <Grid key={idx}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.secondary.main,
                  0.08
                )} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                borderRadius: 2,
                "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                transition: "all 0.3s ease",
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
                  <Grid size={{ sm: 5 }}>
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
                    size={{ sm: 2 }}
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

// --- Drawings Editor ---

function ContractDrawingsEditor({ drawings, setDrawings }) {
  const { setProgress, setOverlay } = useUploadContext();
  const theme = useTheme();

  const addRow = () =>
    setDrawings([...drawings, { url: "", file: null, fileName: "" }]);
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
      const fileUpload = await uploadInChunks(file, setProgress, setOverlay);
      if (fileUpload.status === 200) {
        const copy = drawings.slice();
        copy[idx] = { ...copy[idx], url: fileUpload.url };
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
          <Grid key={idx}>
            <Card
              variant="outlined"
              sx={{
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.info.main,
                  0.08
                )} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 2,
                "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                transition: "all 0.3s ease",
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
                    <Grid size={{ sm: 6 }}>
                      <TextField
                        label="URL"
                        value={d.url}
                        onChange={(e) => updateRow(idx, "url", e.target.value)}
                        fullWidth
                        size="small"
                      />
                    </Grid>
                    <Grid size={{ sm: 6 }}>
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

                  {(d.file || d.url) && (
                    <Typography variant="caption" color="text.secondary">
                      Will use {d.file ? "uploaded image" : "URL"} when saving.
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

// --- Main Dialog ---

export default function CreateContractDialog({
  onUpdate,
  clientLeadId = null,
  updatedOuterContract,
  lead,
}) {
  const taxRate = 5;
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { setLoading } = useToastContext();
  const [title, setTitle] = useState("");
  const [enTitle, setEnTitle] = useState("");
  const [projectGroup, setProjectGroup] = useState("");
  const [selectedStages, setSelectedStages] = useState([]);
  const [perStageMeta, setPerStageMeta] = useState({});
  const [payments, setPayments] = useState([]);
  const [specialItems, setSpecialItems] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [arClientName, setArClientName] = useState(lead?.client?.arName);
  const [enClientName, setEnClientName] = useState(lead?.client?.enName);
  const steps = ["Basics", "Items & Drawings"];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setActiveStep(0);
  };

  const canGoNext = () => {
    //to do check payments conditions
    if (activeStep === 0) {
      if (!title.trim()) return false;
      if (!enTitle.trim()) return false;
      if (!arClientName || !arClientName.trim()) return false;
      if (!enClientName || !enClientName.trim()) return false;
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
      if (payments.some((p) => !p.condition)) return false;
      return true;
    }
    // if (activeStep === 1) {
    //   for (let i = 1; i < payments.length; i++) {
    //     const r = paymentRules[i] || {};
    //     if (!r.activateOnSigning) {
    //       if (!r.projectName || !r.condition) return false;
    //     }
    //   }
    //   return true;
    // }
    return true;
  };

  const next = () => {
    if (!canGoNext()) return;
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const stagesPayload = selectedStages.map((s, idx) => ({
      title: `${s.label}`,
      levelEnum: s.enum,
      deliveryDays: Number(perStageMeta?.[s.enum]?.deliveryDays || 0),
      deptDeliveryDays: perStageMeta?.[s.enum]?.deptDeliveryDays
        ? Number(perStageMeta[s.enum].deptDeliveryDays)
        : null,
    }));

    const payload = {
      clientLeadId,
      title: title.trim(),
      enTitle: enTitle.trim(),
      arName: arClientName.trim(),
      enName: enClientName.trim(),
      projectGroupId: projectGroup,
      stages: stagesPayload,
      payments: payments,
      specialItems,
      drawings,
    };

    const req = await handleRequestSubmit(
      payload,
      setLoading,
      `shared/contracts/`,
      false,
      "Creating"
    );

    if (req.status === 200) {
      onUpdate();
      if (updatedOuterContract) {
        const detailsReq = await getDataAndSet({
          url: `shared/contracts/${req?.data?.id}`,
          setLoading,
        });

        updatedOuterContract(detailsReq.data);
      }
      handleClose();
    }
  };

  const subtotal = useMemo(
    () => sum(payments.map((p) => p.amount)),
    [payments]
  );
  const tax = useMemo(
    () => ((Number(taxRate) || 0) * subtotal) / 100,
    [taxRate, subtotal]
  );
  const grand = useMemo(() => subtotal + tax, [subtotal, tax]);

  return (
    <Box>
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={<FaPlus />}
        size="large"
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          textTransform: "none",
          fontSize: "1rem",
          fontWeight: 600,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        Create New Contract
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: theme.palette.primary.contrastText,
            fontWeight: 700,
            fontSize: "1.3rem",
            p: 2.5,
          }}
        >
          Create New Contract
        </DialogTitle>

        <DialogContent
          dividers
          sx={{ p: 3, bgcolor: alpha(theme.palette.background.paper, 0.8) }}
        >
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
                  label="Arabic Contract type"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter arabic contract type"
                />

                <TextField
                  label="English Contract type"
                  value={enTitle}
                  onChange={(e) => setEnTitle(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter english contract type"
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Lead Client Name : {lead?.client?.name}
                </Typography>
                <TextField
                  label="Arabic client name"
                  value={arClientName}
                  onChange={(e) => setArClientName(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter arabic client name"
                />

                <TextField
                  label="English client name"
                  value={enClientName}
                  onChange={(e) => setEnClientName(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="Enter english client name"
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
                />
              </Stack>
            )}

            {/* {activeStep === 1 && (
              <PaymentsRulesEditor
                payments={payments}
                rules={paymentRules}
                setRules={setPaymentRules}
              />
            )} */}

            {activeStep === 1 && (
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
              onClick={back}
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
              disabled={!canGoNext()}
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
              onClick={handleSubmit}
              variant="contained"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Create Contract
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
