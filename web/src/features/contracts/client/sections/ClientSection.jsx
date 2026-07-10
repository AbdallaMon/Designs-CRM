// ClientSection.jsx
"use client";

import React, { useMemo } from "react";
import { Stack, Typography, Chip, Grid } from "@mui/material";
import { FaInfoCircle } from "react-icons/fa";
import { FIXED_TEXT } from "@/features/contracts/client/wittenBlocksData.js";
import { SectionCard, KeyValue } from "@/features/contracts/client/sections/primitives.jsx";
import {
  extractStageNumber,
  numList,
  getToday,
  emirateOrCountryLabel,
} from "@/features/contracts/client/sections/sessionHelpers.js";

// -----------------------------
// Sections
// -----------------------------
export default function ClientSection({ session, lng }) {
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
