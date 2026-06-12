"use client";

// LeadStatusChart — binds to GET /v2/dashboard/leads-status.
// Response .data shape (getDashboardLeadStatusData): an ARRAY of
//   { status: "IN PROGRESS", count: <number> }   (status has underscores replaced by spaces)
// Mirrors the legacy LeadStatusChart (recharts BarChart, per-status colored bars), Arabic.

import { Box, useMediaQuery, useTheme } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS, STATUS_COLORS } from "@/app/helpers/colors.js";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { LEADS_STATUS_URL } from "../config/constant.js";
import { WidgetCard } from "./WidgetCard.jsx";

// English status (spaces) → Arabic label for the X axis / tooltip.
const STATUS_AR = {
  NEW: "جديد",
  IN_PROGRESS: "قيد التنفيذ",
  INTERESTED: "مهتم",
  NEEDS_IDENTIFIED: "تحديد الاحتياج",
  NEGOTIATING: "تفاوض",
  CONVERTED: "محوّل",
  REJECTED: "مرفوض",
  FINALIZED: "مُبرم",
  ON_HOLD: "معلّق",
  ARCHIVED: "مؤرشف",
};

export function LeadStatusChart({ enabled = true }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data, isLoading } = useRequest({
    url: LEADS_STATUS_URL,
    method: "get",
    autoFetch: enabled,
  });

  const rows = Array.isArray(data) ? data : [];
  // status arrives space-separated ("IN PROGRESS"); normalize to the enum key for color + label.
  const chartData = rows.map((r) => {
    const key = String(r.status || "").replace(/ /g, "_");
    return { key, label: STATUS_AR[key] || r.status, count: Number(r.count) || 0 };
  });

  return (
    <WidgetCard
      title="توزيع حالات العملاء"
      loading={isLoading}
      isEmpty={chartData.length === 0}
      minHeight={isMobile ? 350 : 400}
    >
      <Box sx={{ height: isMobile ? 350 : 400 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth="400px">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: isMobile ? 20 : 40, left: 10, bottom: isMobile ? 80 : 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              interval={0}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? "end" : "middle"}
              height={isMobile ? 80 : 30}
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ top: -10 }} />
            <Bar dataKey="count" name="عدد العملاء" fill="#8884d8">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.key] || COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </WidgetCard>
  );
}

export default LeadStatusChart;
