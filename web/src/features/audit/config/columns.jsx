import { alpha, Box, Chip, Stack, Typography } from "@mui/material";
import {
  AUDIT_ACTION_LABEL,
  AUDIT_MODULE_LABEL,
} from "@/features/audit/config/constant.js";

// Declarative AdminTable columns for the action-audit viewer. Each column is
// `{ name, label, type: "function", render(item) }` (the AdminTable contract). The
// trail is READ-ONLY, so there are no edit/delete columns; a "Details" action is
// injected by AuditLogTable via AdminTable's `extraComponent`.

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const auditColumns = [
  {
    name: "createdAt",
    label: "Time",
    type: "function",
    render: (item) => (
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
        {formatDateTime(item.createdAt)}
      </Typography>
    ),
  },
  {
    name: "actor",
    label: "Actor",
    type: "function",
    render: (item) => {
      const actor = item.actor || {};
      return (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary" noWrap>
            {actor.name || (actor.id != null ? `User #${actor.id}` : "—")}
          </Typography>
          {actor.profile && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {actor.profile}
            </Typography>
          )}
        </Box>
      );
    },
  },
  {
    name: "module",
    label: "Module",
    type: "function",
    render: (item) =>
      item.module ? (
        <Chip
          size="small"
          label={AUDIT_MODULE_LABEL[item.module] || item.module}
          sx={{
            fontWeight: 600,
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
          }}
        />
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      ),
  },
  {
    name: "action",
    label: "Action",
    type: "function",
    render: (item) => (
      <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
        {AUDIT_ACTION_LABEL[item.action] || item.action || "—"}
      </Typography>
    ),
  },
  {
    name: "entity",
    label: "Entity",
    type: "function",
    render: (item) => {
      if (!item.entityType && item.entityId == null) {
        return (
          <Typography variant="caption" color="text.disabled">
            —
          </Typography>
        );
      }
      return (
        <Stack direction="row" spacing={0.75} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography variant="body2" color="text.primary">
            {item.entityType || "—"}
          </Typography>
          {item.entityId != null && (
            <Chip
              size="small"
              variant="outlined"
              label={`#${item.entityId}`}
              sx={{ fontWeight: 600, borderRadius: 1.5, color: "text.secondary" }}
            />
          )}
          {item.clientLeadId != null && item.clientLeadId !== item.entityId && (
            <Chip
              size="small"
              variant="outlined"
              label={`Deal #${item.clientLeadId}`}
              sx={{ fontWeight: 600, borderRadius: 1.5, color: "text.secondary" }}
            />
          )}
        </Stack>
      );
    },
  },
  {
    name: "summary",
    label: "Summary",
    type: "function",
    render: (item) => (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 320, whiteSpace: "normal" }}
      >
        {item.summary || "—"}
      </Typography>
    ),
  },
];
