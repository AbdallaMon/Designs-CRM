"use client";

import React, { useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  Chip,
  Divider,
  Stack,
  useTheme,
} from "@mui/material";
import { InfoCard } from "./InfoCard";
import { MdPayment } from "react-icons/md";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";

/**
 * LeadStripeInfo
 * - Expects lead.stripieMetadata as: [{ key: "name", value: "Ahmed" }, ...]
 * - Renders nothing if empty.
 */
export default function LeadStripeInfo({ lead }) {
  const theme = useTheme();
  const items = Array.isArray(lead?.stripieMetadata)
    ? lead.stripieMetadata
    : [];
  const { user } = useAuth();

  const admin = checkIfAdmin(user);

  // helper to get readable labels
  const labelFor = (key) => {
    const map = {
      name: "Name",
      email: "Email",
      phone: "Phone",
      billingAddressLine1: "Address Line 1",
      billingAddressLine2: "Address Line 2",
      billingCity: "City",
      billingState: "State/Region",
      billingPostalCode: "Postal Code",
      billingCountry: "Country",
      paymentMethod: "Payment Method",
    };
    if (map[key]) return map[key];
    // fallback: split camelCase / snake_case nicely
    return String(key)
      .replace(/[_-]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .replace(/^./, (c) => c.toUpperCase());
  };

  const paymentMethod = useMemo(
    () => items.find((i) => i.key === "paymentMethod")?.value || "",
    [items]
  );

  if (!items.length) return null;
  if (!admin) return;
  return (
    <InfoCard title="Stripe Payment Data" icon={MdPayment} theme={theme}>
      <Stack spacing={1.5}>
        {paymentMethod ? (
          <Chip
            label={paymentMethod}
            size="small"
            sx={{
              alignSelf: "flex-start",
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          />
        ) : null}

        <Divider />

        <Grid container spacing={1.5}>
          {items.map(({ key, value }, idx) => (
            <Grid key={`${key}-${idx}`} item xs={12} md={6}>
              <Box
                sx={{
                  p: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.25 }}
                >
                  {labelFor(key)}
                </Typography>
                <Typography variant="body2">
                  {value === undefined ||
                  value === null ||
                  String(value).trim() === ""
                    ? "—"
                    : String(value)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </InfoCard>
  );
}
