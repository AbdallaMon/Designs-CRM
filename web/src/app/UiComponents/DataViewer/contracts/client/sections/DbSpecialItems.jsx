// DbSpecialItems.jsx
"use client";

import React from "react";
import { List, ListItem, ListItemText, useTheme } from "@mui/material";
import { SectionCard } from "./primitives";

export default function DbSpecialItems({ session, lng }) {
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
