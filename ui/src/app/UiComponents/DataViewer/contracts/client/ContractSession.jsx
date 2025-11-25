// ContractSession.jsx
"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  TableContainer,
  useMediaQuery,
  IconButton,
  useTheme,
  Container,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  FaCheckCircle,
  FaInfoCircle,
  FaCheck,
  FaMinusCircle,
} from "react-icons/fa";
// ====== bring shared constants from your codebase =====
// (Assume these imports remain the same in your project)
import {
  CONTRACT_LEVELSENUM,
  COUNTRY_LABEL,
  EMIRATE_LABEL,
  UAE_LABEL,
  STAGE_STATUS_LABEL,
} from "@/app/helpers/constants";
import {
  FIXED_TEXT,
  PAYMENT_ORDINAL,
  defaultStageLabels,
  STAGE_PROGRESS,
} from "./wittenBlocksData";
import { FloatingActionButton } from "../../image-session/client-session/Utility";

// -----------------------------
// Helpers (kept unchanged behavior)
// -----------------------------
const formatAED = (value, lng) => {
  try {
    const n = Number(value ?? 0);
    const locale = lng === "ar" ? "ar-AE" : "en-AE";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${value} AED`;
  }
};

const emirateOrCountryLabel = ({ emirate, country }, lng) => {
  if (!emirate || emirate === "OUTSIDE") {
    if (country && COUNTRY_LABEL[country]) return COUNTRY_LABEL[country][lng];
    return country || "-";
  }
  return `${EMIRATE_LABEL[lng][emirate]} — ${UAE_LABEL[lng]}`;
};

const extractStageNumber = (title, fallbackOrder) => {
  if (!title) return fallbackOrder ?? 0;
  const m = String(title).match(/(\d+)$/);
  if (m) return Number(m[1]);
  return fallbackOrder ?? 0;
};

const numList = (arr) => arr.filter((v) => v != null && v !== "").join(", ");

const getToday = (lng) => {
  const locale = lng === "ar" ? "ar" : "en";
  return dayjs().locale(locale).format("YYYY/MM/DD");
};

// FRONTEND
function buildPaymentLine({ payment, index, lng, taxRate }) {
  const ordinal =
    PAYMENT_ORDINAL[lng][index] ||
    (lng === "ar" ? `دفعة ${index}` : `Payment ${index}`);

  const baseAmountNum = Number(payment.amount || 0);
  const rate = taxRate > 1 ? taxRate / 100 : taxRate; // expects 0.05, but handles 5 too
  const amountWithTaxNum = baseAmountNum * (1 + (rate || 0));

  const amt = formatAED(baseAmountNum, lng);
  const amtWithTax = formatAED(amountWithTaxNum, lng);

  let primary =
    lng === "ar"
      ? payment.conditionItem?.labelAr
      : payment.conditionItem?.labelEn || payment.conditionItem?.labelAr;

  const taxNote =
    lng === "ar"
      ? `${amtWithTax} (شامل الضريبة)`
      : `${amtWithTax} (VAT included)`;

  if (index === 1) {
    return lng === "ar"
      ? `• ${ordinal} عند توقيع العقد بقيمه: ${taxNote}`
      : `• ${ordinal} on contract signature: ${taxNote}`;
  }

  return lng === "ar"
    ? `• ${ordinal} ${primary || ""} : ${taxNote}`
    : `• ${ordinal} ${primary || ""} : ${taxNote}`;
}

// small util to split first sentence (for highlighting)
const splitFirstSentence = (text) => {
  if (!text) return ["", ""];
  const nl = text.indexOf("\n");
  const plain = nl > -1 ? text.slice(0, nl + 1) + text.slice(nl + 1) : text;
  const match = plain.match(/^(.+?[.!؟\n])(\s*)([\s\S]*)$/u);
  if (match) return [match[1].trim(), match[3].trim()];
  // fallback: split by first dot
  const idx = plain.indexOf(".");
  if (idx > -1)
    return [plain.slice(0, idx + 1).trim(), plain.slice(idx + 1).trim()];
  return [plain, ""];
};

// -----------------------------
// UI atoms
// -----------------------------
function SectionCard({ title, children, action, dense }) {
  return (
    <Card variant="outlined" sx={{ overflow: "hidden" }}>
      {title && (
        <CardHeader
          title={<Typography variant="h6">{title}</Typography>}
          action={action}
          sx={{
            "& .MuiCardHeader-title": { fontWeight: 700 },
            py: dense ? 1 : 2,
          }}
        />
      )}
      <Divider />
      <CardContent sx={{ p: dense ? 2 : 3 }}>{children}</CardContent>
    </Card>
  );
}

function KeyValue({ label, value, isRtlValue }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      sx={{ width: "100%" }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ direction: isRtlValue ? "rtl" : "ltr", textAlign: "right" }}
      >
        {value ?? "-"}
      </Typography>
    </Stack>
  );
}

function BulletText({ text }) {
  return (
    <Typography
      variant="body2"
      sx={{ whiteSpace: "pre-line", lineHeight: 1.9 }}
    >
      {text}
    </Typography>
  );
}

// ClauseCard: NO collapse/show-more — always show full text. Lighter background.
function ClauseCard({ title, text, theme, isRtl }) {
  const [first, rest] = splitFirstSentence(text);
  // use a subtle tinted background (lighter than action.hover)
  const bg = alpha(theme.palette.primary.main, 0.03);
  return (
    <Box
      sx={{
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        p: 2,
        borderRadius: 1,
        mb: 1.5,
        backgroundColor: bg,
      }}
    >
      {title && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
      )}
      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
        <strong>{first}</strong>
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
        {rest ? <span style={{ whiteSpace: "pre-line" }}> {rest}</span> : null}
      </Typography>
    </Box>
  );
}

// -----------------------------
// Sections
// -----------------------------
function ClientSection({ session, lng }) {
  const client = session?.clientLead?.client || {};
  const lead = session?.clientLead || {};

  const stagesNums = useMemo(() => {
    const nums = (session?.stages || []).map((s) =>
      extractStageNumber(s.title, s.order)
    );
    return nums.sort((a, b) => a - b);
  }, [session?.stages]);

  const today = useMemo(() => getToday(lng), [lng]);
  const name =
    (lng === "ar" ? client?.arName : client?.enName || client?.arName) ||
    client?.name;
  return (
    <SectionCard title={FIXED_TEXT.titles.partyOne[lng]}>
      <Grid container spacing={2}>
        <Grid size={{ md: 6 }}>
          <KeyValue
            label={lng === "ar" ? "اسم المالك" : "Owner name"}
            value={name}
            isRtlValue={lng === "ar"}
          />
        </Grid>

        <Grid size={{ md: 6 }}>
          <KeyValue
            label={lng === "ar" ? "العنوان" : "Address"}
            value={emirateOrCountryLabel(
              { emirate: lead?.emirate, country: lead?.country },
              lng
            )}
            isRtlValue={lng === "ar"}
          />
        </Grid>

        <Grid size={{ md: 6 }}>
          <KeyValue
            label={lng === "ar" ? "رقم الهاتف" : "Phone"}
            value={client?.phone}
          />
        </Grid>

        <Grid size={{ md: 6 }}>
          <KeyValue
            label={lng === "ar" ? "البريد الإلكتروني" : "Email"}
            value={client?.email}
          />
        </Grid>
        <Grid size={{ md: 6 }}>
          <KeyValue
            label={lng === "ar" ? "نوع المشروع" : "Project Type"}
            value={
              lng === "ar" ? session?.title : session?.enTitle || session?.title
            }
          />
        </Grid>
        <Grid size={{ md: 6 }}>
          <KeyValue
            label={lng === "ar" ? "كود المشروع" : "Project Code"}
            value={lead?.code || lead?.id}
          />
        </Grid>

        {/* <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid> */}

        <Grid size={{ md: 6 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {FIXED_TEXT.titles.includesStages[lng]}:
            </Typography>
            <Typography variant="body2">{numList(stagesNums)}</Typography>
          </Stack>
        </Grid>

        <Grid size={{ md: 6 }}>
          <Chip
            icon={<FaInfoCircle />}
            label={FIXED_TEXT.todayWritten[lng](today)}
            variant="outlined"
          />
        </Grid>
      </Grid>
    </SectionCard>
  );
}

function AmountParagraph({ session, lng }) {
  const amount = Number(session?.amount ?? 0);
  const vatRate = Number(session?.taxRate ?? 0);
  const total = session?.totalAmount ?? amount * (1 + vatRate / 100);

  if (lng === "ar") {
    return (
      <SectionCard title={FIXED_TEXT.titles.amounts[lng]} dense>
        <Stack spacing={1.25}>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            اتفق الفريقان على أن تكون تكلفة التصميم الداخلي للمشروع هي:{" "}
            <b>{formatAED(amount, "ar")}</b>
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            مع ضريبة <b>{vatRate}%</b> تصبح تكلفة التصميم{" "}
            <b>{formatAED(total, "ar")}</b>
          </Typography>
        </Stack>
      </SectionCard>
    );
  }

  return (
    <SectionCard title={FIXED_TEXT.titles.amounts[lng]} dense>
      <Stack spacing={1.25}>
        <Typography variant="body2">
          Both parties agreed that the interior design cost is:{" "}
          <b>{formatAED(amount, "en")}</b>.
        </Typography>
        <Typography variant="body2">
          With VAT <b>{vatRate}%</b>, the total design cost becomes{" "}
          <b>{formatAED(total, "en")}</b>.
        </Typography>
      </Stack>
    </SectionCard>
  );
}

function DbSpecialItems({ session, lng }) {
  const items = (session?.specialItems || [])
    .map((it) => (lng === "ar" ? it.labelAr : it.labelEn || it.labelAr))
    .filter(Boolean);

  if (!items.length) return null;

  // Always show all items (no collapse), and slightly lighter background
  const theme = useTheme();
  return (
    <SectionCard title={lng === "ar" ? "بنود خاصة" : "Special Terms"} dense>
      <List dense>
        {items.map((t, i) => (
          <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
            <ListItemText
              primaryTypographyProps={{ variant: "body2" }}
              primary={`• ${t}`}
            />
          </ListItem>
        ))}
      </List>
    </SectionCard>
  );
}

function PartyOneWithPayments({ session, lng, contractUtility }) {
  const payments = session?.payments || session?.paymentsNew || [];

  return (
    <SectionCard
      title={lng === "ar" ? "التزامات الفريق الأول " : "Party One Obligations"}
      dense
    >
      <Stack spacing={1.25}>
        <BulletText
          text={
            lng === "ar"
              ? contractUtility.obligationsPartyOneAr
              : contractUtility.obligationsPartyOneEn
          }
        />

        {!!payments.length && (
          <Fragment>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
              {lng === "ar" ? " دفعات العقد:" : "Payment schedule:"}
            </Typography>
            <List dense>
              {payments.map((p, i) => {
                const idx = i + 1;
                return (
                  <ListItem key={p.id || i} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText
                      primaryTypographyProps={{ variant: "body2" }}
                      primary={buildPaymentLine({
                        payment: p,
                        index: idx,
                        lng,
                        taxRate: session?.taxRate,
                      })}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Fragment>
        )}
      </Stack>
    </SectionCard>
  );
}

// -----------------------------
// Stages: responsive -- mobile: show all stages expanded (no Accordion).
// -----------------------------
function RenderStageBullets({ details }) {
  const seperateByNewLineIntoBullets = details
    .split("\n")
    .filter((line) => line.trim() !== "");
  return (
    <Stack spacing={0.5}>
      {seperateByNewLineIntoBullets.map((line, i) => (
        <Typography key={i} variant="body2">
          • {line}
        </Typography>
      ))}
    </Stack>
  );
}
function StagesTable({ session, lng, levelClauses }) {
  const theme = useTheme();
  const isSmall = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  const baseStages = CONTRACT_LEVELSENUM.slice(0, 6).map((s, i) => ({
    key: s.enum,
    order: i + 1,
    label: lng === "ar" ? s.labelAr : s.labelEn,
  }));

  const stagesMap = new Map();
  (session?.stages || []).forEach((st) => {
    const k = st.order || extractStageNumber(st.title);
    stagesMap.set(k, st);
  });

  // header labels
  const head = {
    ar: ["# ", "المرحلة", "الحالة", "يشمل العقد", "أيام التسليم", "التفاصيل"],
    en: ["#", "Stage", "Status", "Included", "Delivery days", "Details"],
  }[lng];

  if (isSmall) {
    // Mobile: render expanded cards (no collapse)
    return (
      <SectionCard title={FIXED_TEXT.titles.allStagesMatrix[lng]}>
        <Stack spacing={1}>
          {baseStages.map((s) => {
            const included = stagesMap.has(s.order);
            const data = stagesMap.get(s.order) || {};
            const status = data?.stageStatus || "NOT_STARTED";
            const deliveryDays = data?.deliveryDays;
            const currentLevel = levelClauses.find((l) => l.level === s.key);

            return (
              <Box
                key={s.key}
                sx={{
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                  p: 2,
                  backgroundColor: alpha(theme.palette.background.paper, 0.98),
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {s.order}.
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {s.label || defaultStageLabels[s.order][lng]}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      size="small"
                      color={
                        status === "COMPLETED"
                          ? "success"
                          : status === "IN_PROGRESS"
                          ? "warning"
                          : "default"
                      }
                      icon={status === "COMPLETED" ? <FaCheck /> : undefined}
                      label={STAGE_STATUS_LABEL[lng][status] || status}
                    />
                  </Stack>
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Stack spacing={1}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Chip
                      size="small"
                      color={included ? "success" : "default"}
                      icon={included ? <FaCheckCircle /> : <FaMinusCircle />}
                      label={
                        included
                          ? lng === "ar"
                            ? "يــــشمـــــل الــعـقـــــد"
                            : "Included"
                          : lng === "ar"
                          ? "لا يــــشمـــــل"
                          : "Not included"
                      }
                    />
                    <Typography variant="body2">
                      {deliveryDays != null
                        ? lng === "ar"
                          ? `أيام التسليم: ${deliveryDays} يوم`
                          : `Delivery days: ${deliveryDays}`
                        : "—"}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <RenderStageBullets
                      details={
                        lng === "ar"
                          ? currentLevel?.textAr
                          : currentLevel
                          ? currentLevel.textEn
                          : ""
                      }
                    />
                    {/* {(STAGE_PROGRESS[s.order]?.[lng] || []).map((t, i) => (
                      <Typography key={i} variant="body2">
                        • {t}
                      </Typography>
                    ))} */}
                  </Stack>
                  {data?.notes && (
                    <Typography variant="body2" color="text.secondary">
                      {data.notes}
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </SectionCard>
    );
  }

  const dir = lng === "ar" ? "rtl" : "ltr";

  // Distribute stages across two rows to limit width.
  // For 7 -> [3,4], otherwise split roughly half/half.
  const distributeStages = (stages) => {
    const n = stages.length;
    if (n === 7) return [stages.slice(0, 3), stages.slice(3)];
    const mid = Math.ceil(n / 2);
    return [stages.slice(0, mid), stages.slice(mid)];
  };

  const [rowA, rowB] = distributeStages(baseStages);

  const StageColumn = ({ s }) => {
    const included = stagesMap.has(s.order);
    const data = stagesMap.get(s.order) || {};
    const status = data?.stageStatus || "NOT_STARTED";
    const deliveryDays = data?.deliveryDays;
    const details = levelClauses.find((l) => l.level === s.key);

    return (
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          p: 1.25,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          backgroundColor: alpha(theme.palette.background.paper, 0.98),
          minHeight: 280, // taller to fit the three parts nicely
        }}
      >
        {/* Part 1: included/not + status + stage name */}
        <Stack spacing={1}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            <Chip
              size="small"
              color={included ? "success" : "default"}
              icon={included ? <FaCheckCircle /> : <FaMinusCircle />}
              label={
                included
                  ? lng === "ar"
                    ? "يــــشمـــــل الــعـقـــــد"
                    : "Included"
                  : lng === "ar"
                  ? "لا يــــشمـــــل"
                  : "Not included"
              }
            />
            <Chip
              size="small"
              color={
                status === "COMPLETED"
                  ? "success"
                  : status === "IN_PROGRESS"
                  ? "warning"
                  : "default"
              }
              icon={status === "COMPLETED" ? <FaCheck /> : undefined}
              label={STAGE_STATUS_LABEL[lng][status] || status}
            />
          </Stack>

          <Typography
            variant="body2"
            sx={{ fontWeight: 700, textAlign: "center" }}
          >
            {s.order}. {s.label || defaultStageLabels[s.order][lng]}
          </Typography>
        </Stack>

        {/* Part 2: delivery days (short form) */}
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {included && deliveryDays != null
              ? lng === "ar"
                ? `${deliveryDays} يوم`
                : `${deliveryDays} days`
              : "—"}
          </Typography>
        </Box>

        {/* Part 3: details (taller) */}
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Stack spacing={0.5}>
            <RenderStageBullets
              details={
                lng === "ar" ? details?.textAr : details ? details.textEn : ""
              }
            />

            {data?.notes ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {data.notes}
              </Typography>
            ) : null}
          </Stack>
        </Box>
      </Box>
    );
  };

  const RowGrid = ({ items }) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length || 1}, minmax(220px, 1fr))`,
        gap: 1.5,
        mb: 1.5,
      }}
    >
      {items.map((s) => (
        <StageColumn key={s.key} s={s} />
      ))}
    </Box>
  );

  return (
    <SectionCard title={FIXED_TEXT.titles.allStagesMatrix[lng]}>
      <Box dir={dir} sx={{ px: 1, py: 1.5 }}>
        {!!rowA.length && <RowGrid items={rowA} />}
        {!!rowB.length && <RowGrid items={rowB} />}
      </Box>
    </SectionCard>
  );
}

// Readable stage clauses (now always fully expanded — no collapse)
function ReadableStageClauses({ lng, stageClauses }) {
  const theme = useTheme();
  return (
    <SectionCard title={lng === "ar" ? "بنود المراحل" : "Stage Clauses"}>
      <Stack spacing={2.5}>
        {stageClauses.map((clause, i) => (
          <Box key={i}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {lng === "ar" ? clause.headingAr : clause.headingEn}
            </Typography>
            <ClauseCard
              title={lng === "ar" ? clause.titleAr : clause.titleEn}
              text={lng === "ar" ? clause.descriptionAr : clause.descriptionEn}
              theme={theme}
              isRtl={lng === "ar"}
            />
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
}

function toArabicIndex(n) {
  return (
    [
      "الأولـــــى",
      "الثـــانيــة",
      "الثـــالثــة",
      "الرابــــعـــة",
      "الخــــامســة",
      "الســـادســــة",
      "السابعة",
      "الثامنة",
      "التاسعة",
      "العشرية",
    ][n - 1] || `${n}`
  );
}

function PartyTwoObligations({ lng, contractUtility }) {
  return (
    <SectionCard
      title={lng === "ar" ? "التزامات الفريق الثاني" : "Party Two Obligations"}
      dense
    >
      <BulletText
        text={
          lng === "ar"
            ? contractUtility.obligationsPartyTwoAr
            : contractUtility.obligationsPartyTwoEn
        }
      />
    </SectionCard>
  );
}

function SpecialClauses({ items = [], lng }) {
  const theme = useTheme();
  if (!items.length) return null;

  // Always show all special clauses (بنود خاصة) and slightly lighter background
  return (
    <SectionCard title={lng === "ar" ? "بنود خاصة" : "Special Terms"} dense>
      <Stack spacing={1}>
        {items.map((t, i) => (
          <Box
            key={i}
            sx={{
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              pl: 1.5,
              py: 1,
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              • {t}
            </Typography>
          </Box>
        ))}
      </Stack>
    </SectionCard>
  );
}

function DrawingsSection({ session, lng }) {
  const drawings = session?.drawings || [];
  const has = drawings.length > 0;
  const defaultDrawingUrl = window.location.origin + "/default-drawing.jpg";
  if (!has) {
    return;
    drawings.push({
      fileName: lng === "ar" ? "مخطط افتراضي" : "Default Drawing",
      url: defaultDrawingUrl,
    });
  }
  return (
    <SectionCard title={FIXED_TEXT.titles.drawings[lng]} dense>
      <Grid container spacing={2}>
        {drawings.map((d) => (
          <Grid size={{ md: 4 }}>
            <Card variant="outlined">
              <CardHeader
                title={d.fileName || (lng === "ar" ? "مخطط" : "Drawing")}
              />
              <CardContent>
                <Box
                  component="img"
                  src={d.url}
                  alt={d.fileName || "drawing"}
                  sx={{ width: "100%", borderRadius: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </SectionCard>
  );
}

// -----------------------------
// Main component
// -----------------------------
export default function ContractSession({
  session,
  lng = "ar",
  extraSpecialClauses = [],
  stageClausesOverride,
  onSubmit,
  contractUtility,
}) {
  const [confirmed, setConfirmed] = useState(false);

  // choose clauses: prefer external override if provided
  const stageClauses = useMemo(() => {
    return contractUtility?.stageClauses;
    // const base = STAGE_CLAUSES_DEFAULT;
    // if (!stageClausesOverride) return base;
    // const merged = { ...base };
    // for (const k of [1, 2, 3, 4, 5, 6]) {
    //   if (stageClausesOverride[k]) {
    //     merged[k] = {
    //       ar: stageClausesOverride[k].ar ?? base[k].ar,
    //       en: stageClausesOverride[k].en ?? base[k].en,
    //     };
    //   }
    // }
    // return merged;
  }, [stageClausesOverride]);

  // Default handwritten list if not provided

  const handwritten = useMemo(() => {
    if (extraSpecialClauses?.length) return extraSpecialClauses;

    const specialClauses = contractUtility?.specialClauses || [];
    const groupedTexts = specialClauses.map((clause) =>
      lng === "ar" ? clause.textAr : clause.textEn || clause.textAr
    );
    return groupedTexts;
  }, [extraSpecialClauses, lng, contractUtility]);

  // apply direction for Arabic
  const isRtl = lng === "ar";

  return (
    <Container
      sx={{ p: { xs: 0, md: 3 }, maxWidth: 1200, mx: "auto" }}
      maxWidth="xl"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <Stack spacing={2}>
        {/* 1) Client */}
        <ClientSection session={session} lng={lng} />

        {/* 2) Amount — each line down */}
        <AmountParagraph session={session} lng={lng} />

        {/* 2-bis) DB Special Items — AFTER Design Cost */}
        <DbSpecialItems session={session} lng={lng} />

        {/* 3) Party One Obligations + Payments */}
        <PartyOneWithPayments
          session={session}
          lng={lng}
          contractUtility={contractUtility}
        />

        {/* 4) Stages Table */}
        <StagesTable
          session={session}
          lng={lng}
          levelClauses={contractUtility?.levelClauses}
        />

        {/* 5) Readable Stage Clauses */}
        <ReadableStageClauses lng={lng} stageClauses={stageClauses} />

        {/* 6) Party Two Obligations */}
        <PartyTwoObligations lng={lng} contractUtility={contractUtility} />

        {/* 7) Handwritten Special Clauses — must be AFTER team two obligations */}
        <SpecialClauses lng={lng} items={handwritten} />

        {/* 8) Drawings / Work Areas */}
        <DrawingsSection session={session} lng={lng} />

        {/* 9) Confirmation */}
        <SectionCard title={FIXED_TEXT.titles.confirmation[lng]} dense>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                }}
                inputProps={{ "aria-label": FIXED_TEXT.confirmationLabel[lng] }}
              />
            }
            label={FIXED_TEXT.confirmationLabel[lng]}
          />
        </SectionCard>

        <FloatingActionButton
          handleClick={() => {
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: "smooth",
            });
          }}
          type="NEXT"
        />

        {/* Actions */}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="contained"
            disabled={!confirmed}
            startIcon={<FaCheckCircle />}
            onClick={() => {
              if (!confirmed) return;
              onSubmit && onSubmit();
            }}
          >
            {lng === "ar"
              ? "تأكيد والانتقال للتوقيع"
              : "Confirm and proceed to signing"}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
