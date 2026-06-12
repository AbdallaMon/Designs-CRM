"use client";

// Special-items editor for the create-contract flow. Ported from the legacy
// SpecialItemsEditor, Arabic-only. Produces specialItems[] ({ labelAr, labelEn? } per item).

import React from "react";
import { Stack, Typography, Box, Button, Card, CardHeader, CardContent, Avatar, TextField, IconButton, Tooltip, Divider, Grid, alpha, useTheme } from "@mui/material";
import { FaPlus, FaTrash, FaSitemap } from "react-icons/fa";

export default function SpecialItemsEditor({ items, setItems }) {
  const theme = useTheme();
  const addItem = () => setItems([...items, { labelAr: "", labelEn: "" }]);
  const updateItem = (idx, key, value) => {
    const copy = items.slice();
    copy[idx] = { ...copy[idx], [key]: value };
    setItems(copy);
  };
  const removeItem = (idx) => {
    const copy = items.slice();
    copy.splice(idx, 1);
    setItems(copy);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <FaSitemap style={{ color: theme.palette.secondary.main, fontSize: 20 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>البنود الخاصة</Typography>
        <Box flex={1} />
        <Button startIcon={<FaPlus />} onClick={addItem} variant="contained" size="small">إضافة</Button>
      </Stack>
      <Grid container spacing={2}>
        {items.map((it, idx) => (
          <Grid key={idx} size={{ xs: 12 }}>
            <Card variant="outlined" sx={{ border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`, borderRadius: 2 }}>
              <CardHeader
                title={`بند #${idx + 1}`}
                avatar={<Avatar sx={{ bgcolor: "secondary.main" }}>{idx + 1}</Avatar>}
                slotProps={{ title: { fontWeight: 600 } }}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField label="اسم البند (عربي) *" value={it.labelAr} onChange={(e) => updateItem(idx, "labelAr", e.target.value)} fullWidth required size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField label="اسم البند (إنجليزي)" value={it.labelEn || ""} onChange={(e) => updateItem(idx, "labelEn", e.target.value)} fullWidth size="small" />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Tooltip title="حذف">
                      <span>
                        <IconButton color="error" onClick={() => removeItem(idx)} size="small"><FaTrash /></IconButton>
                      </span>
                    </Tooltip>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
