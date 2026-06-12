"use client";

// IncomeOverTimeChart — binds to GET /v2/dashboard/monthly-performance.
// Response .data shape (getMonthlyPerformanceData): an ARRAY of 12 entries
//   { month: "Jan", leads, finalized, nonSuccess, revenue }
// Mirrors the legacy IncomeOverTimeChart (recharts grouped BarChart), Arabic legend.

import { Box } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { MONTHLY_PERFORMANCE_URL } from "../config/constant.js";
import { WidgetCard } from "./WidgetCard.jsx";

export function IncomeOverTimeChart({ enabled = true }) {
  const { data, isLoading } = useRequest({
    url: MONTHLY_PERFORMANCE_URL,
    method: "get",
    autoFetch: enabled,
  });

  const rows = Array.isArray(data) ? data : [];
  const isEmpty = rows.length === 0;

  return (
    <WidgetCard
      title="الأداء الشهري"
      loading={isLoading}
      isEmpty={isEmpty}
      minHeight={300}
    >
      <Box sx={{ overflowX: "auto" }}>
        <ResponsiveContainer minWidth="800px" width="100%" height={300}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="leads" fill="#8884d8" name="إجمالي العملاء" />
            <Bar dataKey="finalized" fill="#82ca9d" name="عملاء ناجحون" />
            <Bar dataKey="nonSuccess" fill="#ff7f7f" name="عملاء غير ناجحين" />
            <Bar dataKey="revenue" fill="#ffc658" name="الإيرادات (د.إ)" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </WidgetCard>
  );
}

export default IncomeOverTimeChart;
