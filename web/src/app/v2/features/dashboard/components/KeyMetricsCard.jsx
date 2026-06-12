"use client";

// KeyMetricsCard — binds to GET /v2/dashboard/key-metrics.
// Response .data shape (server/services/main/shared/dashboardServices.js → getKeyMetrics):
//   { totalRevenue, averageProjectValue, successRate, leadsCounts, interactedLeads,
//     totalCommission, totalClreadCommission, successLeadsCount, newLeadCounts,
//     inProgressLeadCounts, interestedLeadCounts, needsIdentifiedLeadCounts,
//     negotiatingLeadCounts, rejectedLeadCounts, finalizedLeadCounts, convertedLeadCounts,
//     onHoldLeadCounts, archivedLeadCounts }
// The backend self-scopes by token (admin-tier → global, others → own) so the widget sends
// NO staffId. Mirrors the legacy KeyMetricsCard layout (avatar + metric tiles), Arabic.

import {
  Avatar,
  Box,
  Grid,
  LinearProgress,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  FaChartLine,
  FaDollarSign,
  FaMoneyBillWave,
  FaProjectDiagram,
  FaTasks,
} from "react-icons/fa";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { KEY_METRICS_URL } from "../config/constant.js";
import { WidgetCard } from "./WidgetCard.jsx";

const EMPTY = {
  totalRevenue: 0,
  averageProjectValue: 0,
  successRate: 0,
  leadsCounts: 0,
  interactedLeads: 0,
  successLeadsCount: 0,
  totalCommission: 0,
  totalClreadCommission: 0,
  newLeadCounts: 0,
  inProgressLeadCounts: 0,
  interestedLeadCounts: 0,
  needsIdentifiedLeadCounts: 0,
  negotiatingLeadCounts: 0,
  rejectedLeadCounts: 0,
  finalizedLeadCounts: 0,
  convertedLeadCounts: 0,
  onHoldLeadCounts: 0,
  archivedLeadCounts: 0,
};

const aed = (n) => `${Number(n || 0).toLocaleString("en-US")} د.إ`;

export function KeyMetricsCard({ enabled = true }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data, isLoading } = useRequest({
    url: KEY_METRICS_URL,
    method: "get",
    autoFetch: enabled,
  });
  const m = { ...EMPTY, ...(data || {}) };

  // successRate may arrive as a string ("42.00") from the BE — coerce for the progress bar.
  const successRateNum = Number(m.successRate) || 0;

  const metrics = [
    { title: "إجمالي العملاء", value: m.leadsCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.info.main },
    { title: "تم التفاعل اليوم", value: m.interactedLeads, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.info.main },
    { title: "العملاء الناجحون", value: m.successLeadsCount, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.success.main },
    { title: "نسبة النجاح", value: `${m.successRate}%`, icon: <FaChartLine size={22} color="#fff" />, color: theme.palette.success.main, isProgress: true },
    { title: "متوسط قيمة العميل", value: aed(m.averageProjectValue), icon: <FaProjectDiagram size={22} color="#fff" />, color: theme.palette.secondary.main },
    { title: "إجمالي الإيرادات", value: aed(m.totalRevenue), icon: <FaDollarSign size={22} color="#fff" />, color: theme.palette.primary.main },
    { title: "إجمالي العمولات", value: m.totalCommission, icon: <FaMoneyBillWave size={22} color="#fff" />, color: theme.palette.warning.main },
    { title: "العمولات المسددة", value: m.totalClreadCommission, icon: <FaMoneyBillWave size={22} color="#fff" />, color: theme.palette.warning.main },
    { title: "عملاء جدد", value: m.newLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.info.main },
    { title: "قيد التنفيذ", value: m.inProgressLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.warning.main },
    { title: "مهتمون", value: m.interestedLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.success.main },
    { title: "تم تحديد الاحتياج", value: m.needsIdentifiedLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.secondary.main },
    { title: "قيد التفاوض", value: m.negotiatingLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.primary.main },
    { title: "مرفوضون", value: m.rejectedLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.error.main },
    { title: "تم إبرامهم", value: m.finalizedLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.success.main },
    { title: "تم تحويلهم", value: m.convertedLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.success.main },
    { title: "معلّقون", value: m.onHoldLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.warning.main },
    { title: "مؤرشفون", value: m.archivedLeadCounts, icon: <FaTasks size={22} color="#fff" />, color: theme.palette.grey[600] },
  ];

  return (
    <WidgetCard title="المؤشرات الرئيسية" loading={isLoading}>
      <Grid container spacing={2}>
        {metrics.map((metric, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                p: 2,
                height: "100%",
                boxShadow: 1,
                borderRadius: 2,
                backgroundColor: "background.paper",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
              }}
            >
              <Avatar
                sx={{
                  bgcolor: metric.color,
                  width: 52,
                  height: 52,
                  ml: 2,
                }}
              >
                {metric.icon}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" color="text.secondary" noWrap>
                  {metric.title}
                </Typography>
                <Typography variant={isMobile ? "subtitle1" : "h6"} sx={{ fontWeight: "bold", color: "text.primary" }}>
                  {metric.value}
                </Typography>
                {metric.isProgress && (
                  <Box sx={{ width: "100%", mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, successRateNum)}
                      sx={{
                        height: 8,
                        borderRadius: 5,
                        backgroundColor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 5,
                          backgroundColor: theme.palette.success.main,
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </WidgetCard>
  );
}

export default KeyMetricsCard;
