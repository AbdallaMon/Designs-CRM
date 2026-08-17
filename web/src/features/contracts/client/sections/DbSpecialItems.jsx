// DbSpecialItems.jsx
"use client";

import React from "react";
import { List, ListItem, ListItemText } from "@mui/material";
import { SectionCard } from "@/features/contracts/client/sections/primitives.jsx";

export default function DbSpecialItems({ session, lng }) {
  const items = (session?.specialItems || [])
    .map((it) => (lng === "ar" ? it.labelAr : it.labelEn || it.labelAr))
    .filter(Boolean);

  if (!items.length) return null;

  // Always show all items (no collapse).
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
