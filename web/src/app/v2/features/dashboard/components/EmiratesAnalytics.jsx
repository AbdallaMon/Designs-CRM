"use client";

// EmiratesAnalytics — binds to GET /v2/dashboard/emirates-analytics.
// Response .data shape (getEmiratesAnalytics):
//   { analytics: [{ emirate, leads, totalPrice, averageLeadPrice, growthRate,
//                   selectedCategory, successRate }], dateRange: "<text>" }
// Mirrors the legacy EmiratesAnalytics (recharts ComposedChart + detail tiles), Arabic.

import { Box, Chip, Grid, Typography } from "@mui/material";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { EMIRATES_ANALYTICS_URL } from "../config/constant.js";
import { WidgetCard } from "./WidgetCard.jsx";

// Emirate enum → Arabic name.
const EMIRATE_AR = {
  DUBAI: "دبي",
  ABU_DHABI: "أبوظبي",
  SHARJAH: "الشارقة",
  AJMAN: "عجمان",
  UMM_AL_QUWAIN: "أم القيوين",
  RAS_AL_KHAIMAH: "رأس الخيمة",
  FUJAIRAH: "الفجيرة",
  KHOR_FAKKAN: "خورفكان",
};

const arEmirate = (e) => EMIRATE_AR[e] || String(e || "").replace(/_/g, " ");
const aed = (n) => `${Number(n || 0).toLocaleString("en-US")} د.إ`;

export function EmiratesAnalytics({ enabled = true }) {
  const { data, isLoading } = useRequest({
    url: EMIRATES_ANALYTICS_URL,
    method: "get",
    autoFetch: enabled,
  });

  const analytics = Array.isArray(data?.analytics) ? data.analytics : [];
  // localized copy for the chart axis labels
  const chartData = analytics.map((a) => ({ ...a, emirateAr: arEmirate(a.emirate) }));
  const isEmpty = analytics.length === 0;

  return (
    <WidgetCard
      title={`تحليل الأداء حسب الإمارة${data?.dateRange ? ` (${data.dateRange})` : ""}`}
      subtitle="يشمل هذا التحليل بيانات العملاء والأداء من الشهر الماضي حتى اليوم، لمقارنة أداء الإمارات المختلفة."
      loading={isLoading}
      isEmpty={isEmpty}
      minHeight={360}
    >
      <Box sx={{ overflowX: "auto", height: 360 }}>
        <ResponsiveContainer width="100%" height={350} minWidth={700}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="emirateAr" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            <Bar yAxisId="left" dataKey="totalPrice" fill="#8884d8" name="إجمالي القيمة (د.إ)" />
            <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#82ca9d" name="نسبة النجاح (%)" />
            <Line yAxisId="right" type="monotone" dataKey="growthRate" stroke="#ff7300" name="معدل النمو (%)" />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          مؤشرات تفصيلية
        </Typography>
        <Grid container spacing={2}>
          {analytics.map((emirate) => (
            <Grid size={{ xs: 12, md: 4 }} key={emirate.emirate}>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "background.default", boxShadow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" fontWeight="bold">
                    {arEmirate(emirate.emirate)}
                  </Typography>
                  <Chip
                    label={`${emirate.growthRate >= 0 ? "+" : ""}${emirate.growthRate}%`}
                    size="small"
                    sx={{
                      backgroundColor:
                        emirate.growthRate >= 0 ? "rgba(76,175,80,0.12)" : "rgba(244,67,54,0.12)",
                      color: emirate.growthRate >= 0 ? "#4caf50" : "#f44336",
                    }}
                  />
                </Box>
                <Box mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    العملاء: {emirate.leads}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    متوسط القيمة: {aed(emirate.averageLeadPrice)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    الفئة الأعلى: {emirate.selectedCategory}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    نسبة النجاح: {emirate.successRate}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </WidgetCard>
  );
}

export default EmiratesAnalytics;
