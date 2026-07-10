"use client";
// PipelineByStatus — a compact horizontal-bar list of the pipeline: one row per
// ClientLead_status (enum name), showing the human label, deal count, aggregated value
// (AED), and a proportional bar. Colors + labels come from the SAME helpers the Kanban /
// dashboard use (ClientLeadStatus labels + statusColors), so a status looks identical
// everywhere. No accounting money — value is the admin-visible ClientLead.averagePrice sum.
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";
import { formatCurrency } from "@/app/helpers/functions/utility.js";
import { ClientLeadStatus } from "@/app/helpers/constants/leads.js";
import { statusColors } from "@/app/helpers/constants/ui.js";
import { STATUS_COLORS } from "@/app/helpers/colors.js";

function statusColor(status) {
  return statusColors[status] || STATUS_COLORS[status] || "#9a8e82";
}

function statusLabel(status) {
  return ClientLeadStatus[status] || String(status || "").replace(/_/g, " ");
}

export default function PipelineByStatus({ pipeline, loading }) {
  const rows = Array.isArray(pipeline) ? pipeline : [];
  const maxCount = rows.reduce((m, r) => Math.max(m, Number(r.count) || 0), 0) || 1;

  return (
    <Card sx={{ height: "100%", boxShadow: 3, borderRadius: 2, position: "relative" }}>
      {loading && <LoadingOverlay />}
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", color: "text.primary" }}>
          Pipeline by Status
        </Typography>

        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            {loading ? "Loading pipeline…" : "No pipeline data."}
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {rows.map((row) => {
              const color = statusColor(row.status);
              const count = Number(row.count) || 0;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <Box key={row.status}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 0.5 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                        {statusLabel(row.status)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="baseline" spacing={1.25} sx={{ flexShrink: 0 }}>
                      <Typography variant="body2" fontWeight={700} color="text.primary">
                        {count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {formatCurrency(row.value)}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Box
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      bgcolor: "action.disabledBackground",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 5,
                        bgcolor: color,
                        transition: "width .3s ease",
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
