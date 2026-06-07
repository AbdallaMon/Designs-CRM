"use client";

// PUBLIC e-sign — the contract review view (status === "INITIAL"). Ported from the legacy
// `client/ContractSession.jsx` but SINGLE-LANGUAGE Arabic (the v2 app is Arabic/RTL only). The
// substantive clause text comes from the backend `contractUtility` payload (obligations /
// stageClauses / specialClauses / levelClauses); the session carries client/amount/stages/
// payments/drawings/specialItems. Behavior preserved: the client reads, ticks the
// acknowledgement, then proceeds to signing (onSubmit advances the status to SIGNING).

import React, { useMemo, useState, Fragment } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Chip,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Button,
  Grid,
  useMediaQuery,
  useTheme,
  Container,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FaCheckCircle, FaInfoCircle, FaCheck, FaMinusCircle } from "react-icons/fa";
import {
  CONTRACT_LEVELSENUM,
  STAGE_STATUS_LABEL,
  formatAED,
  emirateOrCountryLabel,
} from "../../config/contractConstants.js";
import { FIXED_TEXT, PAYMENT_ORDINAL, defaultStageLabels } from "../../config/writtenBlocksData.js";

const extractStageNumber = (title, fallbackOrder) => {
  if (!title) return fallbackOrder ?? 0;
  const m = String(title).match(/(\d+)$/);
  if (m) return Number(m[1]);
  return fallbackOrder ?? 0;
};

const numList = (arr) => arr.filter((v) => v != null && v !== "").join(", ");

const getToday = () => dayjs().locale("ar").format("YYYY/MM/DD");

function buildPaymentLine({ payment, index, taxRate }) {
  const ordinal = PAYMENT_ORDINAL[index] || `دفعة ${index}`;
  const baseAmountNum = Number(payment.amount || 0);
  const rate = taxRate > 1 ? taxRate / 100 : taxRate; // expects 0.05, but handles 5 too
  const amountWithTaxNum = baseAmountNum * (1 + (rate || 0));
  const amtWithTax = formatAED(amountWithTaxNum);
  const taxNote = `${amtWithTax} (شامل الضريبة)`;
  const primary = payment.conditionItem?.labelAr;

  if (index === 1) return `• ${ordinal} عند توقيع العقد بقيمه: ${taxNote}`;
  return `• ${ordinal} ${primary || ""} : ${taxNote}`;
}

const splitFirstSentence = (text) => {
  if (!text) return ["", ""];
  const plain = text;
  const match = plain.match(/^(.+?[.!؟\n])(\s*)([\s\S]*)$/u);
  if (match) return [match[1].trim(), match[3].trim()];
  const idx = plain.indexOf(".");
  if (idx > -1) return [plain.slice(0, idx + 1).trim(), plain.slice(idx + 1).trim()];
  return [plain, ""];
};

function SectionCard({ title, children, action, dense }) {
  return (
    <Card variant="outlined" sx={{ overflow: "hidden" }}>
      {title && (
        <CardHeader
          title={<Typography variant="h6">{title}</Typography>}
          action={action}
          sx={{ "& .MuiCardHeader-title": { fontWeight: 700 }, py: dense ? 1 : 2 }}
        />
      )}
      <Divider />
      <CardContent sx={{ p: dense ? 2 : 3 }}>{children}</CardContent>
    </Card>
  );
}

function KeyValue({ label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%" }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ textAlign: "right" }}>
        {value ?? "-"}
      </Typography>
    </Stack>
  );
}

function BulletText({ text }) {
  return (
    <Typography variant="body2" sx={{ whiteSpace: "pre-line", lineHeight: 1.9 }}>
      {text}
    </Typography>
  );
}

function ClauseCard({ title, text, theme }) {
  const [first, rest] = splitFirstSentence(text);
  const bg = alpha(theme.palette.primary.main, 0.03);
  return (
    <Box sx={{ borderRight: `4px solid ${theme.palette.primary.main}`, p: 2, borderRadius: 1, mb: 1.5, backgroundColor: bg }}>
      {title && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
      )}
      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
        <strong>{first}</strong>
      </Typography>
      {rest ? (
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          {rest}
        </Typography>
      ) : null}
    </Box>
  );
}

function RenderStageBullets({ details }) {
  if (!details) return null;
  const lines = details.split("\n").filter((line) => line.trim() !== "");
  return (
    <Stack spacing={0.5}>
      {lines.map((line, i) => (
        <Typography key={i} variant="body2">
          • {line}
        </Typography>
      ))}
    </Stack>
  );
}

function ClientSection({ session }) {
  const client = session?.clientLead?.client || {};
  const lead = session?.clientLead || {};
  const stagesNums = useMemo(() => {
    const nums = (session?.stages || []).map((s) => extractStageNumber(s.title, s.order));
    return nums.sort((a, b) => a - b);
  }, [session?.stages]);
  const today = useMemo(() => getToday(), []);
  const name = client?.arName || client?.name;
  return (
    <SectionCard title={FIXED_TEXT.titles.partyOne}>
      <Grid container spacing={2}>
        <Grid size={{ md: 6 }}><KeyValue label="اسم المالك" value={name} /></Grid>
        <Grid size={{ md: 6 }}>
          <KeyValue label="العنوان" value={emirateOrCountryLabel({ emirate: lead?.emirate, country: lead?.country })} />
        </Grid>
        <Grid size={{ md: 6 }}><KeyValue label="رقم الهاتف" value={client?.phone} /></Grid>
        <Grid size={{ md: 6 }}><KeyValue label="البريد الإلكتروني" value={client?.email} /></Grid>
        <Grid size={{ md: 6 }}><KeyValue label="نوع المشروع" value={session?.title} /></Grid>
        <Grid size={{ md: 6 }}><KeyValue label="كود المشروع" value={lead?.code || lead?.id} /></Grid>
        <Grid size={{ md: 6 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{FIXED_TEXT.titles.includesStages}:</Typography>
            <Typography variant="body2">{numList(stagesNums)}</Typography>
          </Stack>
        </Grid>
        <Grid size={{ md: 6 }}>
          <Chip icon={<FaInfoCircle />} label={FIXED_TEXT.todayWritten(today)} variant="outlined" />
        </Grid>
      </Grid>
    </SectionCard>
  );
}

function AmountParagraph({ session }) {
  const amount = Number(session?.amount ?? 0);
  const vatRate = Number(session?.taxRate ?? 0);
  const total = session?.totalAmount ?? amount * (1 + vatRate / 100);
  return (
    <SectionCard title={FIXED_TEXT.titles.amounts} dense>
      <Stack spacing={1.25}>
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          اتفق الفريقان على أن تكون تكلفة التصميم الداخلي للمشروع هي: <b>{formatAED(amount)}</b>
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
          مع ضريبة <b>{vatRate}%</b> تصبح تكلفة التصميم <b>{formatAED(total)}</b>
        </Typography>
      </Stack>
    </SectionCard>
  );
}

function DbSpecialItems({ session }) {
  const items = (session?.specialItems || []).map((it) => it.labelAr).filter(Boolean);
  if (!items.length) return null;
  return (
    <SectionCard title="بنود خاصة" dense>
      <List dense>
        {items.map((t, i) => (
          <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
            <ListItemText primary={`• ${t}`} slotProps={{ primary: { variant: "body2" } }} />
          </ListItem>
        ))}
      </List>
    </SectionCard>
  );
}

function PartyOneWithPayments({ session, contractUtility }) {
  const payments = session?.payments || session?.paymentsNew || [];
  return (
    <SectionCard title="التزامات الفريق الأول" dense>
      <Stack spacing={1.25}>
        <BulletText text={contractUtility?.obligationsPartyOneAr} />
        {!!payments.length && (
          <Fragment>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>دفعات العقد:</Typography>
            <List dense>
              {payments.map((p, i) => (
                <ListItem key={p.id || i} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={buildPaymentLine({ payment: p, index: i + 1, taxRate: session?.taxRate })}
                    slotProps={{ primary: { variant: "body2" } }}
                  />
                </ListItem>
              ))}
            </List>
          </Fragment>
        )}
      </Stack>
    </SectionCard>
  );
}

function StagesTable({ session, levelClauses = [] }) {
  const theme = useTheme();
  const isSmall = useMediaQuery((t) => t.breakpoints.down("sm"));
  const baseStages = CONTRACT_LEVELSENUM.slice(0, 6).map((s, i) => ({ key: s.enum, order: i + 1, label: s.label }));
  const stagesMap = new Map();
  (session?.stages || []).forEach((st) => {
    const k = st.order || extractStageNumber(st.title);
    stagesMap.set(k, st);
  });

  const StageCard = ({ s }) => {
    const included = stagesMap.has(s.order);
    const data = stagesMap.get(s.order) || {};
    const status = data?.stageStatus || "NOT_STARTED";
    const deliveryDays = data?.deliveryDays;
    const currentLevel = levelClauses.find((l) => l.level === s.key);
    return (
      <Box sx={{ borderRadius: 1, border: 1, borderColor: "divider", p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.98), height: "100%" }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.order}.</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.label || defaultStageLabels[s.order]}</Typography>
          </Stack>
          <Chip
            size="small"
            color={status === "COMPLETED" ? "success" : status === "IN_PROGRESS" ? "warning" : "default"}
            icon={status === "COMPLETED" ? <FaCheck /> : undefined}
            label={STAGE_STATUS_LABEL[status] || status}
          />
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Chip
              size="small"
              color={included ? "success" : "default"}
              icon={included ? <FaCheckCircle /> : <FaMinusCircle />}
              label={included ? "يشمل العقد" : "لا يشمل"}
            />
            <Typography variant="body2">
              {included && deliveryDays != null ? `أيام التسليم: ${deliveryDays} يوم` : "—"}
            </Typography>
          </Stack>
          <RenderStageBullets details={currentLevel?.textAr} />
          {data?.notes && (
            <Typography variant="body2" color="text.secondary">{data.notes}</Typography>
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <SectionCard title={FIXED_TEXT.titles.allStagesMatrix}>
      <Box sx={{ display: "grid", gridTemplateColumns: isSmall ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: 1.5 }}>
        {baseStages.map((s) => (
          <StageCard key={s.key} s={s} />
        ))}
      </Box>
    </SectionCard>
  );
}

function ReadableStageClauses({ stageClauses }) {
  const theme = useTheme();
  if (!stageClauses || !stageClauses.length) return null;
  return (
    <SectionCard title="بنود المراحل">
      <Stack spacing={2.5}>
        {stageClauses.map((clause, i) => (
          <Box key={i}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>{clause.headingAr}</Typography>
            <ClauseCard title={clause.titleAr} text={clause.descriptionAr} theme={theme} />
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
}

function PartyTwoObligations({ contractUtility }) {
  return (
    <SectionCard title="التزامات الفريق الثاني" dense>
      <BulletText text={contractUtility?.obligationsPartyTwoAr} />
    </SectionCard>
  );
}

function SpecialClauses({ items = [] }) {
  const theme = useTheme();
  if (!items.length) return null;
  return (
    <SectionCard title="بنود خاصة" dense>
      <Stack spacing={1}>
        {items.map((t, i) => (
          <Box key={i} sx={{ borderRight: `3px solid ${theme.palette.primary.main}`, pr: 1.5, py: 1, backgroundColor: alpha(theme.palette.primary.main, 0.03), borderRadius: 1 }}>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>• {t}</Typography>
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
}

function DrawingsSection({ session }) {
  const drawings = session?.drawings || [];
  if (!drawings.length) return null;
  return (
    <SectionCard title={FIXED_TEXT.titles.drawings} dense>
      <Grid container spacing={2}>
        {drawings.map((d, i) => (
          <Grid key={d.id || i} size={{ md: 4 }}>
            <Card variant="outlined">
              <CardHeader title={d.fileName || "مخطط"} />
              <CardContent>
                <Box component="img" src={d.url} alt={d.fileName || "drawing"} sx={{ width: "100%", borderRadius: 1 }} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </SectionCard>
  );
}

export default function ContractSessionView({ session, contractUtility, onSubmit }) {
  const [confirmed, setConfirmed] = useState(false);

  const stageClauses = useMemo(() => contractUtility?.stageClauses, [contractUtility]);

  const handwritten = useMemo(() => {
    const specialClauses = contractUtility?.specialClauses || [];
    return specialClauses.map((clause) => clause.textAr).filter(Boolean);
  }, [contractUtility]);

  return (
    <Container sx={{ p: { xs: 0, md: 3 }, maxWidth: 1200, mx: "auto" }} maxWidth="xl" dir="rtl">
      <Stack spacing={2}>
        <ClientSection session={session} />
        <AmountParagraph session={session} />
        <DbSpecialItems session={session} />
        <PartyOneWithPayments session={session} contractUtility={contractUtility} />
        <StagesTable session={session} levelClauses={contractUtility?.levelClauses} />
        <ReadableStageClauses stageClauses={stageClauses} />
        <PartyTwoObligations contractUtility={contractUtility} />
        <SpecialClauses items={handwritten} />
        <DrawingsSection session={session} />

        <SectionCard title={FIXED_TEXT.titles.confirmation} dense>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                inputProps={{ "aria-label": FIXED_TEXT.confirmationLabel }}
              />
            }
            label={FIXED_TEXT.confirmationLabel}
          />
        </SectionCard>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="contained"
            disabled={!confirmed}
            startIcon={<FaCheckCircle />}
            onClick={() => {
              if (!confirmed) return;
              onSubmit?.();
            }}
          >
            تأكيد والانتقال للتوقيع
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
