// ContractSession.jsx
"use client";

import React, { useMemo, useState } from "react";
import {
  Stack,
  Checkbox,
  FormControlLabel,
  Button,
  Container,
} from "@mui/material";
import { FaCheckCircle } from "react-icons/fa";
import { FIXED_TEXT } from "@/features/contracts/client/wittenBlocksData.js";
import { FloatingActionButton } from "@/features/image-session/client-session/Utility.jsx";
import { SectionCard } from "@/features/contracts/client/sections/primitives.jsx";
import ClientSection from "@/features/contracts/client/sections/ClientSection.jsx";
import AmountParagraph from "@/features/contracts/client/sections/AmountParagraph.jsx";
import DbSpecialItems from "@/features/contracts/client/sections/DbSpecialItems.jsx";
import PartyOneWithPayments from "@/features/contracts/client/sections/PartyOneWithPayments.jsx";
import StagesTable from "@/features/contracts/client/sections/StagesTable.jsx";
import ReadableStageClauses from "@/features/contracts/client/sections/ReadableStageClauses.jsx";
import PartyTwoObligations from "@/features/contracts/client/sections/PartyTwoObligations.jsx";
import SpecialClauses from "@/features/contracts/client/sections/SpecialClauses.jsx";
import DrawingsSection from "@/features/contracts/client/sections/DrawingsSection.jsx";

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
  console.log(
    contractUtility?.stageClauses,
    "<< stage clauses in contract session"
  );
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
