"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  LinearProgress,
  alpha,
  useTheme,
  Alert,
} from "@mui/material";
import {
  FaCopy,
  FaUser,
  FaArrowRight,
  FaArrowLeft,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  sanitizePaymentsForSubmit,
  sanitizeDrawingsForSubmit,
} from "@/features/contracts/shared/contractHelpers.js";

// Import shared components
import ProjectGroupSelect from "@/features/contracts/shared/ProjectGroupSelect.jsx";
import StagesSelector from "@/features/contracts/shared/StagesSelector.jsx";
import PaymentsEditor from "@/features/contracts/shared/PaymentsEditor.jsx";
import SpecialItemsEditor from "@/features/contracts/shared/SpecialItemsEditor.jsx";
import ContractDrawingsEditor from "@/features/contracts/shared/ContractDrawingsEditor.jsx";
import { CONTRACT_LEVELSENUM } from "@/app/helpers/constants";
import { SectionHeader } from "@/features/contracts/shared/formKit.jsx";
import { ContractDialogShell, StepRail } from "@/features/contracts/shared/dialogKit.jsx";
export default function CloneContract({
  sourceId,
  onCloned,
  open,
  handleCloneClose,
}) {
  const theme = useTheme();
  const { setLoading } = useToastContext();

  const taxRate = 5;
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Basics", "Items & Drawings"];

  // fetched
  const [loadingSrc, setLoadingSrc] = useState(false);
  const [src, setSrc] = useState(null);

  // editable states (default all editable)
  const [clientLeadId, setClientLeadId] = useState(null);
  const [title, setTitle] = useState("");
  const [enTitle, setEnTitle] = useState("");
  const [arClientName, setArClientName] = useState("");
  const [enClientName, setEnClientName] = useState("");
  const [projectGroup, setProjectGroup] = useState("");

  const [selectedStages, setSelectedStages] = useState([]); // [{enum,label}]
  const [perStageMeta, setPerStageMeta] = useState({}); // { [enum]: {deliveryDays, deptDeliveryDays} }

  const [payments, setPayments] = useState([]); // [{amount, note}]

  const [specialItems, setSpecialItems] = useState([]); // [{labelAr,labelEn}]
  const [drawings, setDrawings] = useState([]); // [{url,fileName}]
  const [validationErrors, setValidationErrors] = useState([]);
  useEffect(() => {
    async function fetchCurrent() {
      const req = await getDataAndSet({
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
    setEnTitle((src.enTitle || "").trim());
    setProjectGroup(src.projectGroupId || "");

    setArClientName(src.clientLead?.client?.arName || "");
    setEnClientName(src.clientLead?.client?.enName || "");
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
    const pmts = (src.paymentsNew || []).map((p, idx) => ({
      amount: Number(p.amount || 0),
      note: p.note || "",
      type: p.project?.type || "",
      condition: idx === 0 ? "SIGNATURE" : p.paymentCondition || "",
      conditionId: p.conditionId || null,
      conditionItem: p.conditionItem || null,
    }));
    setPayments(pmts);

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
      if (!enTitle.trim()) return false;
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
      if (payments.some((r) => !r.condition)) return false;
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
      isActive: perStageMeta?.[s.enum]?.isActive || false,
    }));

    const payload = {
      clientLeadId,
      title: title.trim(),
      enTitle: enTitle.trim(),
      projectGroupId: projectGroup,
      stages: stagesPayload,
      payments: sanitizePaymentsForSubmit(payments),
      specialItems,
      drawings: sanitizeDrawingsForSubmit(drawings),
      // clone extras:
      oldContractId: sourceId,
      // markOldAsCancelled: true,
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
      <ContractDialogShell
        open={open}
        onClose={handleClose}
        icon={<FaCopy />}
        title="Clone Contract"
        subtitle="Review and edit contract details before creating the copy"
        activeStep={activeStep}
        steps={steps}
      >
        <DialogContent
          dividers
          sx={{ p: { xs: 2, sm: 3 }, bgcolor: theme.palette.background.default }}
        >
          {loadingSrc ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 6 }}>
              <LinearProgress sx={{ width: "100%", borderRadius: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Loading source contract…
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={3}>
              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Please fix the following errors:
                    </Typography>
                    {validationErrors.map((error, idx) => (
                      <Typography key={idx} variant="body2" sx={{ ms: 1 }}>
                        • {error}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
              )}

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: "background.paper",
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <StepRail steps={steps} activeStep={activeStep} />
              </Box>

              {activeStep === 0 && (
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2.5,
                      bgcolor: "background.paper",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <SectionHeader
                      icon={<FaCopy />}
                      title="Contract & Client Details"
                      subtitle="Contract type, client name, and project group"
                    />
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
                        <TextField
                          label="Arabic Contract type"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="English Contract type"
                          value={enTitle}
                          onChange={(e) => setEnTitle(e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Box>

                      {src?.clientLead?.client?.name && (
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{
                            px: 1.5,
                            py: 1,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                          }}
                        >
                          <FaUser style={{ color: theme.palette.primary.main }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Lead Client Name :{" "}
                            {src?.clientLead?.client?.name}
                          </Typography>
                        </Stack>
                      )}

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                          gap: 2,
                        }}
                      >
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
                      </Box>

                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700, mb: 1 }}
                        >
                          Project Group
                        </Typography>
                        <ProjectGroupSelect
                          value={projectGroup}
                          onChange={setProjectGroup}
                          clientLeadId={clientLeadId}
                        />
                      </Box>
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2.5,
                      bgcolor: "background.paper",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <StagesSelector
                      selected={selectedStages}
                      onChange={setSelectedStages}
                      perStageMeta={perStageMeta}
                      setPerStageMeta={setPerStageMeta}
                    />
                  </Box>

                  <Box
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2.5,
                      bgcolor: "background.paper",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <PaymentsEditor
                      payments={payments}
                      setPayments={setPayments}
                      taxRate={taxRate}
                    />
                  </Box>
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
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2.5,
                      bgcolor: "background.paper",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <SpecialItemsEditor
                      items={specialItems}
                      setItems={setSpecialItems}
                    />
                  </Box>
                  <Box
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderRadius: 2.5,
                      bgcolor: "background.paper",
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <ContractDrawingsEditor
                      drawings={drawings}
                      setDrawings={setDrawings}
                    />
                  </Box>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            gap: 1,
            bgcolor: "background.paper",
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button onClick={handleClose} sx={{ fontWeight: 700 }} color="inherit">
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          {activeStep > 0 && (
            <Button
              onClick={() => setActiveStep((s) => Math.max(s - 1, 0))}
              variant="outlined"
              startIcon={<FaArrowRight />}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 && (
            <Button
              onClick={next}
              variant="contained"
              disabled={loadingSrc || !canGoNext()}
              endIcon={<FaArrowLeft />}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
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
              startIcon={<FaCheck />}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Create Clone
            </Button>
          )}
        </DialogActions>
      </ContractDialogShell>

      {/* final confirm warning */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogContent sx={{ pt: 3, textAlign: "center" }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              mx: "auto",
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: alpha(theme.palette.warning.main, 0.14),
              color: theme.palette.warning.main,
              fontSize: 24,
            }}
          >
            <FaExclamationTriangle />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            Confirm Clone
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Continue and send the new data ?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            sx={{ fontWeight: 700 }}
            color="inherit"
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            color="error"
            variant="contained"
            onClick={handleSubmit}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Yes, Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
