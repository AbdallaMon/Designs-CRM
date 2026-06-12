"use client";

// Stage selector for the create-contract flow. Ported from the legacy StagesSelector,
// Arabic-only. Lets the user pick the contract stages (CONTRACT_LEVELSENUM) and set per-stage
// delivery + department days. Produces `selected` (array of {enum,label}) + `perStageMeta`
// keyed by enum; the parent builds the BE stages[] payload.

import React from "react";
import { Stack, Typography, Chip, Divider, Card, CardHeader, CardContent, Avatar, TextField, Grid, alpha, useTheme } from "@mui/material";
import { FaClipboardList, FaCheckCircle } from "react-icons/fa";
import { CONTRACT_LEVELSENUM, CONTRACT_LEVEL } from "../../../config/contractConstants.js";

export default function StagesSelector({ selected, onChange, perStageMeta, setPerStageMeta }) {
  const theme = useTheme();

  const toggleStage = (stg) => {
    const exists = selected.find((s) => s.enum === stg.enum);
    if (exists) {
      onChange(selected.filter((s) => s.enum !== stg.enum));
      const { [stg.enum]: _drop, ...rest } = perStageMeta || {};
      setPerStageMeta(rest);
    } else {
      onChange([...selected, stg]);
      setPerStageMeta({ ...perStageMeta, [stg.enum]: { deliveryDays: "", deptDeliveryDays: "" } });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaClipboardList style={{ color: theme.palette.primary.main, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>اختر المراحل</Typography>
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {CONTRACT_LEVELSENUM.map((item) => {
          const active = !!selected.find((s) => s.enum === item.enum);
          return (
            <Chip
              key={item.enum}
              label={`${item.label} (${item.enum})`}
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
              onClick={() => toggleStage(item)}
              icon={active ? <FaCheckCircle /> : undefined}
              sx={{ mb: 1 }}
            />
          );
        })}
      </Stack>
      {selected.length > 0 && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Divider />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>تفاصيل المراحل</Typography>
          <Grid container spacing={2}>
            {selected.map((s, idx) => (
              <Grid key={s.enum} size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, borderRadius: 2 }}>
                  <CardHeader
                    avatar={<Avatar sx={{ bgcolor: "primary.main" }}>{idx + 1}</Avatar>}
                    title={s.enum}
                    subheader={CONTRACT_LEVEL[s.enum]?.name}
                    slotProps={{ title: { fontWeight: 600 } }}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          type="number"
                          label="أيام التسليم *"
                          value={perStageMeta?.[s.enum]?.deliveryDays ?? ""}
                          onChange={(e) => setPerStageMeta({ ...perStageMeta, [s.enum]: { ...perStageMeta?.[s.enum], deliveryDays: e.target.value } })}
                          fullWidth
                          required
                          size="small"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          type="number"
                          label="أيام القسم *"
                          value={perStageMeta?.[s.enum]?.deptDeliveryDays ?? ""}
                          onChange={(e) => setPerStageMeta({ ...perStageMeta, [s.enum]: { ...perStageMeta?.[s.enum], deptDeliveryDays: e.target.value } })}
                          fullWidth
                          required
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      )}
    </Stack>
  );
}
