"use client";
// ActivityFeed — the last N ActionAuditLog events (actor · action · relative time), fed by
// the existing admin-only audit endpoint (Build #1). Action copy is REUSED from the audit
// feature's config (AUDIT_ACTION_LABEL) so wording stays in one place; "View all" deep-links
// to the full audit viewer.
import NextLink from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { FiArrowRight } from "react-icons/fi";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";
import { AUDIT_ACTION_LABEL } from "@/features/audit/config/constant.js";

// Compact relative time (e.g. "3m ago", "2h ago", "5d ago"), falling back to a date.
function relativeTime(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  if (diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "2-digit",
  });
}

function actionLabel(action) {
  return AUDIT_ACTION_LABEL[action] || String(action || "").replace(/_/g, " ") || "—";
}

export default function ActivityFeed({ items, loading, error, onRetry }) {
  const rows = Array.isArray(items) ? items : [];

  return (
    <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2, position: "relative" }}>
      {loading && <LoadingOverlay />}
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary" }}>
            Recent Activity
          </Typography>
          <Button
            component={NextLink}
            href="/dashboard/audit-logs"
            size="small"
            endIcon={<FiArrowRight size={14} />}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            View all
          </Button>
        </Stack>

        {error ? (
          <Stack spacing={1} alignItems="flex-start" sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Couldn&apos;t load recent activity.
            </Typography>
            {onRetry && (
              <Button size="small" variant="outlined" onClick={onRetry} sx={{ textTransform: "none" }}>
                Retry
              </Button>
            )}
          </Stack>
        ) : rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            {loading ? "Loading activity…" : "No recent activity."}
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {rows.map((item) => {
              const actor = item.actor || {};
              const actorName = actor.name || (actor.id != null ? `User #${actor.id}` : "System");
              return (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="baseline"
                  spacing={1}
                  sx={{ minWidth: 0 }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.4 }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {actorName}
                      </Box>{" "}
                      <Box component="span" sx={{ color: "text.secondary" }}>
                        {actionLabel(item.action)}
                      </Box>
                    </Typography>
                    {item.summary && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {item.summary}
                      </Typography>
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
                  >
                    {relativeTime(item.createdAt)}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
