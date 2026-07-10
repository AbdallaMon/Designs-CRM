// PartyOneWithPayments.jsx
import React, { Fragment } from "react";
import {
  Stack,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { SectionCard, BulletText } from "@/features/contracts/client/sections/primitives.jsx";
import { buildPaymentLine } from "@/features/contracts/client/sections/sessionHelpers.js";

export default function PartyOneWithPayments({ session, lng, contractUtility }) {
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
