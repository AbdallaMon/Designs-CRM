// DrawingsSection.jsx
"use client";

import React from "react";
import { Box, Card, CardHeader, CardContent, Grid } from "@mui/material";
import { FIXED_TEXT } from "@/app/UiComponents/DataViewer/contracts/client/wittenBlocksData.js";
import { SectionCard } from "@/app/UiComponents/DataViewer/contracts/client/sections/primitives.jsx";

export default function DrawingsSection({ session, lng }) {
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
