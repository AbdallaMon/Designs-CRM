"use client";

import React, { useMemo, useState } from "react";
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
  Stepper,
  Step,
  StepLabel,
  useTheme,
  alpha,
  Divider,
  Alert,
  Snackbar,
  IconButton,
} from "@mui/material";
import { FaPlus, FaUpload, FaExclamationCircle } from "react-icons/fa";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

// Import shared components
import ProjectGroupSelect from "./shared/ProjectGroupSelect";
import StagesSelector from "./shared/StagesSelector";
import PaymentsEditor from "./shared/PaymentsEditor";
import SpecialItemsEditor from "./shared/SpecialItemsEditor";
import ContractDrawingsEditor from "./shared/ContractDrawingsEditor";
import { sum } from "./shared/contractHelpers";
import { MdClose } from "react-icons/md";

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
  const [validationErrors, setValidationErrors] = useState([]);
  const steps = ["Basics", "Items & Drawings"];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setActiveStep(0);
  };

  const validateStep = () => {
    const errors = [];

    if (activeStep === 0) {
      if (!title.trim()) errors.push("Arabic contract title is required");
      if (!enTitle.trim()) errors.push("English contract title is required");
      if (!arClientName || !arClientName.trim())
        errors.push("Arabic client name is required");
      if (!enClientName || !enClientName.trim())
        errors.push("English client name is required");
      if (!projectGroup) errors.push("Project group must be selected");
      if (selectedStages.length === 0)
        errors.push("At least one stage must be selected");

      for (const s of selectedStages) {
        const dd = perStageMeta?.[s.enum]?.deliveryDays;
        const deptDd = perStageMeta?.[s.enum]?.deptDeliveryDays;
        if (!dd || Number(dd) <= 0)
          errors.push(`Stage ${s.enum}: Delivery days must be greater than 0`);
        if (!deptDd || Number(deptDd) <= 0)
          errors.push(
            `Stage ${s.enum}: Department days must be greater than 0`
          );
      }
      if (payments.length === 0)
        errors.push("At least one payment must be added");
      if (payments.some((p) => !p.amount || Number(p.amount) <= 0))
        errors.push("All payments must have an amount greater than 0");
      if (payments.some((p) => !p.condition))
        errors.push("All payments must have a payment condition");
    }

    return errors;
  };

  const next = () => {
    const errors = validateStep();
    setValidationErrors(errors);
    if (errors.length > 0) return;
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
      isActive: perStageMeta?.[s.enum]?.isActive || false,
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
            {validationErrors.length > 0 && (
              <Snackbar
                open={true}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                autoHideDuration={10000}
                onClose={() => setValidationErrors([])}
              >
                <Alert
                  severity="error"
                  sx={{
                    position: "relative",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Please fix the following errors:
                    </Typography>
                    {validationErrors.map((error, idx) => (
                      <Typography key={idx} variant="body2" sx={{ ml: 1 }}>
                        • {error}
                      </Typography>
                    ))}
                  </Stack>
                  <IconButton
                    aria-label="close"
                    onClick={() => setValidationErrors([])}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: 8,
                      color: (theme) => theme.palette.grey[500],
                    }}
                  >
                    <MdClose />
                  </IconButton>
                </Alert>
              </Snackbar>
            )}
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
