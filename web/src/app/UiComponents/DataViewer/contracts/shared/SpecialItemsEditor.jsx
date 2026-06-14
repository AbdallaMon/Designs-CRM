"use client";

import React from "react";
import {
  Stack,
  TextField,
  IconButton,
  Tooltip,
  Grid,
  useTheme,
} from "@mui/material";
import { FaPlus, FaTrash, FaSitemap } from "react-icons/fa";
import { SectionHeader, EditorCard, EmptyState, AddButton } from "./formKit";

export default function SpecialItemsEditor({ items, setItems }) {
  const theme = useTheme();
  const secondary = theme.palette.secondary.main;

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
      <SectionHeader
        icon={<FaSitemap />}
        title="بنود خاصة"
        subtitle="بنود إضافية تُدرج ضمن العقد (اختياري)"
        count={items.length}
        color={secondary}
        action={
          <AddButton
            onClick={addItem}
            label="إضافة بند"
            startIcon={<FaPlus />}
            color={secondary}
          />
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<FaSitemap />}
          color={secondary}
          text="لا توجد بنود خاصة — يمكنك إضافة بنود إن لزم."
          action={
            <AddButton
              onClick={addItem}
              label="إضافة بند"
              startIcon={<FaPlus />}
              color={secondary}
            />
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {items.map((it, idx) => (
            <EditorCard
              key={idx}
              accent={secondary}
              index={idx + 1}
              label={`البند #${idx + 1}`}
              onRemove={
                <Tooltip title="حذف">
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => removeItem(idx)}
                      size="small"
                    >
                      <FaTrash />
                    </IconButton>
                  </span>
                </Tooltip>
              }
            >
              <Grid container spacing={1.5} alignItems="flex-start">
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="اسم البند (عربي) *"
                    value={it.labelAr}
                    onChange={(e) => updateItem(idx, "labelAr", e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="اسم البند (إنجليزي)"
                    value={it.labelEn || ""}
                    onChange={(e) => updateItem(idx, "labelEn", e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </EditorCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
