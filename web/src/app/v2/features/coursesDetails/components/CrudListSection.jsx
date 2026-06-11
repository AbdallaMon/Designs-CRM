"use client";

// <CrudListSection> — a reusable SectionCard wrapping a lazily-fetched list of simple items
// (lesson videos / video-pdfs / pdfs / links) with add + delete. The nested lesson-content
// lists all share this shape: fetch (useLazyResource) → render rows → an inline add form → a
// per-row delete, each mutation routed through runCoursesMutation (CODE → Arabic toast). Gated
// at the CALL SITE on COURSE.MANAGE (the caller passes `canManage`; without it the add/delete
// affordances are hidden). All five read-states wired. Arabic / RTL.
//
// Props:
//   title, subtitle           — section header.
//   fetchFn ()=>envelope      — list read (returns data array).
//   deps []                   — fetch deps (re-fetch when these change).
//   canManage bool            — show add/delete affordances.
//   renderRow (item)=>node    — row primary content.
//   getRowKey (item)=>key     — default item.id.
//   onAdd (formState)=>Promise|null  — runs the create mutation; truthy result triggers refetch.
//   onDelete (item)=>Promise|null    — runs the delete mutation; truthy result triggers refetch.
//   addFields [{ name, label, type?, options?, required? }] — inline add-form fields.
//   addLabel                  — add button text.
//   emptyText                 — empty list text.

import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import {
  SectionCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/app/v2/shared/components";
import { coursesMessages } from "@/app/v2/features/courses/config/coursesMessages.js";
import { useLazyResource } from "@/app/v2/features/courses/hooks/useLazyResource.js";

export function CrudListSection({
  title,
  subtitle,
  fetchFn,
  deps = [],
  canManage = false,
  renderRow,
  getRowKey,
  onAdd,
  onDelete,
  addFields = [],
  addLabel = "إضافة",
  emptyText = "لا توجد عناصر",
}) {
  const { data, isLoading, error, refetch } = useLazyResource(fetchFn, { deps });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const items = Array.isArray(data) ? data : data?.items ?? [];

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submitAdd() {
    setBusy(true);
    const res = await onAdd?.(form);
    setBusy(false);
    if (res) {
      setForm({});
      setAdding(false);
      refetch();
    }
  }

  async function remove(item) {
    setBusy(true);
    const res = await onDelete?.(item);
    setBusy(false);
    if (res) refetch();
  }

  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      actions={
        canManage && onAdd ? (
          <Button
            size="small"
            variant={adding ? "outlined" : "contained"}
            startIcon={<MdAdd />}
            onClick={() => setAdding((v) => !v)}
          >
            {adding ? "إغلاق" : addLabel}
          </Button>
        ) : null
      }
    >
      {canManage && adding && (
        <Box sx={{ mb: 2 }}>
          <Stack spacing={1.5}>
            {addFields.map((f) =>
              f.type === "select" ? (
                <TextField
                  key={f.name}
                  select
                  size="small"
                  label={f.label}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                >
                  {(f.options ?? []).map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  key={f.name}
                  size="small"
                  type={f.type ?? "text"}
                  label={f.label}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setField(f.name, e.target.value)}
                />
              ),
            )}
            <Box>
              <Button variant="contained" size="small" onClick={submitAdd} disabled={busy}>
                حفظ
              </Button>
            </Box>
          </Stack>
        </Box>
      )}

      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
      ) : isLoading ? (
        <LoadingState variant="form" fields={2} />
      ) : items.length === 0 ? (
        <EmptyState title={emptyText} />
      ) : (
        <List disablePadding>
          {items.map((item) => (
            <ListItem
              key={getRowKey ? getRowKey(item) : item.id}
              divider
              secondaryAction={
                canManage && onDelete ? (
                  <Tooltip title="حذف">
                    <IconButton edge="end" size="small" color="error" onClick={() => remove(item)} disabled={busy}>
                      <MdDelete />
                    </IconButton>
                  </Tooltip>
                ) : null
              }
            >
              <Box sx={{ minWidth: 0, pe: 4 }}>
                {renderRow ? (
                  renderRow(item)
                ) : (
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {item.title ?? item.url ?? `#${item.id}`}
                  </Typography>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </SectionCard>
  );
}

export default CrudListSection;
