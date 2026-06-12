"use client";

// PerformanceMetrics — binds to GET /v2/dashboard/week-performance.
// Response .data shape (getPerformanceMetrics):
//   { currentWeek: "DD/MM : DD/MM", weekly: { newLeads, success, followUps, meetings } }
// Mirrors the legacy PerformanceMetrics card (a 2x2 weekly-activity grid), Arabic labels.

import { Box, Grid, Typography } from "@mui/material";
import colors from "@/app/helpers/colors.js";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { WEEK_PERFORMANCE_URL } from "../config/constant.js";
import { WidgetCard } from "./WidgetCard.jsx";

// weekly metric key → Arabic label.
const WEEKLY_AR = {
  newLeads: "عملاء جدد",
  success: "صفقات ناجحة",
  followUps: "متابعات",
  meetings: "اجتماعات",
};

const ORDER = ["newLeads", "success", "followUps", "meetings"];

export function PerformanceMetrics({ enabled = true }) {
  const { data, isLoading } = useRequest({
    url: WEEK_PERFORMANCE_URL,
    method: "get",
    autoFetch: enabled,
  });

  const weekly = data?.weekly || {};
  const currentWeek = data?.currentWeek || "";

  return (
    <WidgetCard title="مؤشرات النشاط" loading={isLoading} minHeight={160}>
      <Box sx={{ p: 2, borderRadius: 2, backgroundColor: colors.bgSecondary, boxShadow: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          نشاط الأسبوع {currentWeek}
        </Typography>
        <Grid container spacing={2}>
          {ORDER.map((key) => (
            <Grid size={6} key={key}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {WEEKLY_AR[key] || key}
                </Typography>
                <Typography variant="h6" fontWeight="bold">
                  {weekly[key] ?? 0}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </WidgetCard>
  );
}

export default PerformanceMetrics;
