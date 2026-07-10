"use client";
import {
  alpha,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { FiArrowRight, FiX } from "react-icons/fi";
import {
  AUDIT_ACTION_LABEL,
  AUDIT_MODULE_LABEL,
} from "@/features/audit/config/constant.js";

// Renders a single value from the diff (before/after) as readable text. Objects/arrays
// are pretty-printed; null/undefined show an em dash.
function formatValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function ValueBlock({ value, tone }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1,
        borderRadius: 1.5,
        fontSize: "0.78rem",
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        bgcolor: (theme) =>
          alpha(
            tone === "before" ? theme.palette.error.main : theme.palette.success.main,
            0.08
          ),
        border: (theme) =>
          `1px solid ${alpha(
            tone === "before" ? theme.palette.error.main : theme.palette.success.main,
            0.24
          )}`,
        color: "text.primary",
      }}
    >
      {formatValue(value)}
    </Box>
  );
}

// Read-only drawer showing one audit row's metadata + its before→after diff. `detail`
// is `{ changed:[...], before:{...}, after:{...} }` (already redacted at write time) or
// null. When there is no diff, the drawer shows the raw detail (if any) or an empty note.
export default function AuditDetailDrawer({ open, onClose, item }) {
  const detail = item?.detail || null;
  const changed = Array.isArray(detail?.changed) ? detail.changed : [];
  const before = detail?.before || {};
  const after = detail?.after || {};
  const actor = item?.actor || {};

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, maxWidth: "100%" } }}
    >
      <Box sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={700}>
            Audit entry
          </Typography>
          <IconButton onClick={onClose} aria-label="Close details">
            <FiX />
          </IconButton>
        </Stack>

        {!item ? (
          <Typography variant="body2" color="text.secondary">
            No entry selected.
          </Typography>
        ) : (
          <>
            <Stack spacing={1.25} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  size="small"
                  label={AUDIT_MODULE_LABEL[item.module] || item.module || "—"}
                  sx={{ fontWeight: 600, borderRadius: 1.5 }}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={AUDIT_ACTION_LABEL[item.action] || item.action || "—"}
                  sx={{ fontWeight: 600, borderRadius: 1.5 }}
                />
              </Stack>
              {item.summary && (
                <Typography variant="body2" color="text.primary">
                  {item.summary}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDateTime(item.createdAt)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Actor:{" "}
                {actor.name || (actor.id != null ? `User #${actor.id}` : "—")}
                {actor.role ? ` · ${actor.role}` : ""}
              </Typography>
              {(item.entityType || item.entityId != null) && (
                <Typography variant="caption" color="text.secondary">
                  Entity: {item.entityType || "—"}
                  {item.entityId != null ? ` #${item.entityId}` : ""}
                </Typography>
              )}
              {item.clientLeadId != null && (
                <Typography variant="caption" color="text.secondary">
                  Deal: #{item.clientLeadId}
                </Typography>
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Changes
            </Typography>

            {changed.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {detail
                  ? "No field-level changes were recorded for this entry."
                  : "No change details recorded for this entry."}
              </Typography>
            ) : (
              <Stack spacing={2}>
                {changed.map((field) => (
                  <Box key={field}>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ display: "block", mb: 0.75 }}
                    >
                      {field}
                    </Typography>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <ValueBlock value={before[field]} tone="before" />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          color: "text.disabled",
                        }}
                      >
                        <FiArrowRight />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <ValueBlock value={after[field]} tone="after" />
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
}
