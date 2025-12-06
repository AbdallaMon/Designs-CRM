"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Typography,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  alpha,
  useTheme,
  Alert,
} from "@mui/material";
import { FaCopy } from "react-icons/fa";

import { getDataAndSet } from "@/app/helpers/functions/getDataAndSet";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

// Import shared components
import ProjectGroupSelect from "./shared/ProjectGroupSelect";
import StagesSelector from "./shared/StagesSelector";
import PaymentsEditor from "./shared/PaymentsEditor";
import SpecialItemsEditor from "./shared/SpecialItemsEditor";
import ContractDrawingsEditor from "./shared/ContractDrawingsEditor";
import { CONTRACT_LEVELSENUM } from "@/app/helpers/constants";
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
    }));

    const payload = {
      clientLeadId,
      title: title.trim(),
      enTitle: enTitle.trim(),
      projectGroupId: projectGroup,
      stages: stagesPayload,
      payments,
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Lead Client Name : {src?.clientLead?.client?.name}
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
