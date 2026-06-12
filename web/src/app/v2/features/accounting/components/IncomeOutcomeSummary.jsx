"use client";

// Income/Outcome summary cards — the v2 port of the legacy IncomeOutComeSummary
// (ui/src/app/UiComponents/DataViewer/accountant/IncomeOutComeSummary.jsx). Fetches
// GET /v2/accounting/summary (the controller unwraps to the inner object, so res.data is
// { currentMonthIncome, totalIncome, currentMonthOutcome, totalOutcome, currentMonthYear }).
// Gated on SUMMARY_VIEW. Single-language (Arabic); same 4-card layout/colors as legacy.

import { useEffect, useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import { MdAttachMoney, MdMoney, MdTrendingDown, MdTrendingUp } from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { accountingService } from "../accounting.service.js";
import { formatCurrency } from "../config/accountingConstants.js";

const P = PERMISSIONS.ACCOUNTING;

function StatCard({ title, value, description, icon, color }) {
  return (
    <Grid size={{ xs: 12, md: 6 }}>
      <Paper
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          height: 160,
          bgcolor: color.bg,
          borderInlineStart: `6px solid ${color.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ mx: 1, color: color.text }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: color.value }}>
          {formatCurrency(value)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      </Paper>
    </Grid>
  );
}

export function IncomeOutcomeSummary() {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.SUMMARY_VIEW);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!canView) return;
    let active = true;
    accountingService
      .getSummary()
      .then((res) => {
        if (active) setData(res?.data ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [canView]);

  if (!canView) return null;

  const period = data?.currentMonthYear ?? "";

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={3}>
        <StatCard
          title={t("accounting.summary.currentMonthIncome")}
          value={data?.currentMonthIncome}
          description={t("accounting.summary.currentMonthIncomeDesc").replace("{period}", period)}
          icon={<MdTrendingUp size={26} color="#2e7d32" />}
          color={{ bg: "#e8f5e9", border: "#2e7d32", text: "#2e7d32", value: "#1b5e20" }}
        />
        <StatCard
          title={t("accounting.summary.totalIncome")}
          value={data?.totalIncome}
          description={t("accounting.summary.totalIncomeDesc")}
          icon={<MdAttachMoney size={26} color="#388e3c" />}
          color={{ bg: "#f1f8e9", border: "#388e3c", text: "#388e3c", value: "#1b5e20" }}
        />
        <StatCard
          title={t("accounting.summary.currentMonthOutcome")}
          value={data?.currentMonthOutcome}
          description={t("accounting.summary.currentMonthOutcomeDesc").replace("{period}", period)}
          icon={<MdTrendingDown size={26} color="#d32f2f" />}
          color={{ bg: "#ffebee", border: "#d32f2f", text: "#d32f2f", value: "#b71c1c" }}
        />
        <StatCard
          title={t("accounting.summary.totalOutcome")}
          value={data?.totalOutcome}
          description={t("accounting.summary.totalOutcomeDesc")}
          icon={<MdMoney size={26} color="#c62828" />}
          color={{ bg: "#fbe9e7", border: "#c62828", text: "#c62828", value: "#b71c1c" }}
        />
      </Grid>
    </Box>
  );
}

export default IncomeOutcomeSummary;
