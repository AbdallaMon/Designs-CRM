// AmountParagraph.jsx
import React from "react";
import { Stack, Typography } from "@mui/material";
import { FIXED_TEXT } from "@/app/UiComponents/DataViewer/contracts/client/wittenBlocksData.js";
import { SectionCard } from "@/app/UiComponents/DataViewer/contracts/client/sections/primitives.jsx";
import { formatAED } from "@/app/UiComponents/DataViewer/contracts/client/sections/sessionHelpers.js";

export default function AmountParagraph({ session, lng }) {
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
