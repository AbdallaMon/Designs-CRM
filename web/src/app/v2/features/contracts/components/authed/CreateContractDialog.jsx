"use client";

// Create-contract dialog (authed). Ported from the legacy CreateContractDialog, Arabic-only,
// wired to the v2 contracts service. Two steps: (1) basics + stages + payments, (2) special
// items + drawings. Builds the exact BE createContract payload (POST /v2/contracts), which the
// service maps to the .strict() schema (no extra keys). Money fields are validated client-side
// (positive finite) in addition to the BE checks. Gated by the caller on contract.create.

import React, { useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Stack,
  Typography, Stepper, Step, StepLabel, alpha, Divider, Alert, IconButton, useTheme,
} from "@mui/material";
import { MdClose } from "react-icons/md";
import contractsService from "../../contracts.service.js";
import { runContractMutation } from "../../contracts.mutations.js";
import ProjectGroupSelect from "./editors/ProjectGroupSelect.jsx";
import StagesSelector from "./editors/StagesSelector.jsx";
import PaymentsEditor from "./editors/PaymentsEditor.jsx";
import SpecialItemsEditor from "./editors/SpecialItemsEditor.jsx";
import DrawingsEditor from "./editors/DrawingsEditor.jsx";

const isPositiveFinite = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0;
};

export default function CreateContractDialog({ open, onClose, clientLeadId, lead, onSuccess }) {
  const theme = useTheme();
  const steps = ["الأساسيات", "البنود والمخططات"];
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [enTitle, setEnTitle] = useState("");
  const [projectGroup, setProjectGroup] = useState("");
  const [selectedStages, setSelectedStages] = useState([]);
  const [perStageMeta, setPerStageMeta] = useState({});
  const [payments, setPayments] = useState([]);
  const [specialItems, setSpecialItems] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [arClientName, setArClientName] = useState(lead?.client?.arName || "");
  const [enClientName, setEnClientName] = useState(lead?.client?.enName || "");
  const [errors, setErrors] = useState([]);

  const resetAndClose = () => {
    setActiveStep(0);
    setErrors([]);
    onClose?.();
  };

  const validateStep0 = () => {
    const errs = [];
    if (!title.trim()) errs.push("نوع العقد بالعربية مطلوب");
    if (!enTitle.trim()) errs.push("نوع العقد بالإنجليزية مطلوب");
    if (!arClientName.trim()) errs.push("اسم العميل بالعربية مطلوب");
    if (!enClientName.trim()) errs.push("اسم العميل بالإنجليزية مطلوب");
    if (!projectGroup) errs.push("يجب اختيار مجموعة المشروع");
    if (selectedStages.length === 0) errs.push("يجب اختيار مرحلة واحدة على الأقل");
    for (const s of selectedStages) {
      const dd = perStageMeta?.[s.enum]?.deliveryDays;
      const deptDd = perStageMeta?.[s.enum]?.deptDeliveryDays;
      if (!isPositiveFinite(dd)) errs.push(`المرحلة ${s.enum}: أيام التسليم يجب أن تكون أكبر من 0`);
      if (!isPositiveFinite(deptDd)) errs.push(`المرحلة ${s.enum}: أيام القسم يجب أن تكون أكبر من 0`);
    }
    if (payments.length === 0) errs.push("يجب إضافة دفعة واحدة على الأقل");
    if (payments.some((p) => !isPositiveFinite(p.amount))) errs.push("كل الدفعات يجب أن يكون مبلغها أكبر من 0");
    if (payments.some((p) => !p.condition)) errs.push("كل دفعة يجب أن تحتوي على شرط دفع");
    return errs;
  };

  const next = () => {
    const errs = validateStep0();
    setErrors(errs);
    if (errs.length) return;
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    const errs = validateStep0();
    setErrors(errs);
    if (errs.length) {
      setActiveStep(0);
      return;
    }
    const stagesPayload = selectedStages.map((s) => ({
      levelEnum: s.enum,
      deliveryDays: Number(perStageMeta?.[s.enum]?.deliveryDays || 0),
      deptDeliveryDays: perStageMeta?.[s.enum]?.deptDeliveryDays ? Number(perStageMeta[s.enum].deptDeliveryDays) : undefined,
      isActive: perStageMeta?.[s.enum]?.isActive || false,
    }));
    const payload = {
      clientLeadId: Number(clientLeadId),
      title: title.trim(),
      enTitle: enTitle.trim(),
      arName: arClientName.trim(),
      enName: enClientName.trim(),
      projectGroupId: projectGroup,
      stages: stagesPayload,
      payments: payments.map((p) => ({ amount: Number(p.amount), note: p.note, condition: p.condition, conditionId: p.conditionId, type: p.type })),
      specialItems: specialItems.filter((it) => it.labelAr?.trim()),
      drawings: drawings.filter((d) => d.url?.trim()),
    };

    const res = await runContractMutation(
      () => contractsService.create(payload),
      { loading: "جاري إنشاء العقد...", setLoading: setSubmitting },
    );
    if (res) {
      onSuccess?.(res);
      resetAndClose();
    }
  };

  return (
    <Dialog open={open} onClose={resetAndClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: alpha(theme.palette.primary.main, 0.06), fontWeight: 700 }}>
        إنشاء عقد جديد
        <IconButton onClick={resetAndClose} size="small"><MdClose /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {errors.length > 0 && (
            <Alert severity="error" onClose={() => setErrors([])}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>يرجى تصحيح الأخطاء التالية:</Typography>
              {errors.map((e, i) => (
                <Typography key={i} variant="body2" sx={{ mr: 1 }}>• {e}</Typography>
              ))}
            </Alert>
          )}
          <Stepper activeStep={activeStep} alternativeLabel sx={{ pt: 1 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel><Typography variant="caption" sx={{ fontWeight: 600 }}>{label}</Typography></StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Stack spacing={3}>
              <TextField label="نوع العقد (عربي)" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth size="small" />
              <TextField label="نوع العقد (إنجليزي)" value={enTitle} onChange={(e) => setEnTitle(e.target.value)} fullWidth size="small" />
              {lead?.client?.name && (
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>اسم عميل العميل المحتمل: {lead.client.name}</Typography>
              )}
              <TextField label="اسم العميل (عربي)" value={arClientName} onChange={(e) => setArClientName(e.target.value)} fullWidth size="small" />
              <TextField label="اسم العميل (إنجليزي)" value={enClientName} onChange={(e) => setEnClientName(e.target.value)} fullWidth size="small" />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>مجموعة المشروع</Typography>
                <ProjectGroupSelect value={projectGroup} onChange={setProjectGroup} clientLeadId={clientLeadId} />
              </Box>
              <Divider />
              <StagesSelector selected={selectedStages} onChange={setSelectedStages} perStageMeta={perStageMeta} setPerStageMeta={setPerStageMeta} />
              <Divider />
              <PaymentsEditor payments={payments} setPayments={setPayments} taxRate={5} />
            </Stack>
          )}

          {activeStep === 1 && (
            <Stack spacing={3}>
              <SpecialItemsEditor items={specialItems} setItems={setSpecialItems} />
              <Divider />
              <DrawingsEditor drawings={drawings} setDrawings={setDrawings} />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={resetAndClose} sx={{ fontWeight: 600 }}>إلغاء</Button>
        {activeStep > 0 && <Button onClick={back} variant="outlined" sx={{ fontWeight: 600 }}>رجوع</Button>}
        {activeStep < steps.length - 1 && <Button onClick={next} variant="contained" sx={{ fontWeight: 600 }}>التالي</Button>}
        {activeStep === steps.length - 1 && (
          <Button onClick={handleSubmit} variant="contained" color="success" disabled={submitting} sx={{ fontWeight: 600 }}>
            إنشاء العقد
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
