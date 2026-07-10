// StagesTable.jsx
"use client";

import React from "react";
import {
  Box,
  Stack,
  Typography,
  Divider,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FaCheckCircle, FaCheck, FaMinusCircle } from "react-icons/fa";
import {
  CONTRACT_LEVELSENUM,
  STAGE_STATUS_LABEL,
} from "@/app/helpers/constants";
import { FIXED_TEXT, defaultStageLabels } from "@/features/contracts/client/wittenBlocksData.js";
import { SectionCard } from "@/features/contracts/client/sections/primitives.jsx";
import { extractStageNumber } from "@/features/contracts/client/sections/sessionHelpers.js";
import RenderStageBullets from "@/features/contracts/client/sections/RenderStageBullets.jsx";

export default function StagesTable({ session, lng, levelClauses }) {
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
