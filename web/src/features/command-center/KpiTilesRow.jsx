"use client";
// KpiTilesRow — the six headline KPI tiles, reusing the dashboard's KeyMetricFinancialTile
// styling verbatim (gradient card + colored avatar). Money figures render in AED via the
// shared formatCurrency; counts render as plain numbers. All values come from the admin
// overview endpoint — only already-admin-visible money is shown (no accounting exposure).
import { Grid, useMediaQuery, useTheme } from "@mui/material";
import {
  FaDollarSign,
  FaProjectDiagram,
  FaChartLine,
  FaMoneyBillWave,
  FaHandshake,
  FaExclamationTriangle,
} from "react-icons/fa";
import { formatCurrency } from "@/app/helpers/functions/utility.js";
import KeyMetricFinancialTile from "@/features/dashboard/KeyMetricFinancialTile.jsx";

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "0";
}

export default function KpiTilesRow({ kpis, loading }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const k = kpis || {};
  const dash = loading && !kpis ? "—" : undefined;

  const tiles = [
    {
      title: "Active Deals",
      value: dash ?? num(k.activeDeals),
      icon: <FaProjectDiagram size={26} color={theme.palette.info.contrastText} />,
      color: theme.palette.info.main,
    },
    {
      title: "Pipeline Value",
      value: dash ?? formatCurrency(k.pipelineValue),
      icon: <FaChartLine size={26} color={theme.palette.primary.contrastText} />,
      color: theme.palette.primary.main,
    },
    {
      title: "Finalized Value",
      value: dash ?? formatCurrency(k.finalizedValue),
      icon: <FaHandshake size={26} color={theme.palette.secondary.contrastText} />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Revenue",
      value: dash ?? formatCurrency(k.revenue),
      icon: <FaDollarSign size={26} color={theme.palette.success.contrastText} />,
      color: theme.palette.success.main,
    },
    {
      title: "Commissions",
      value: dash ?? formatCurrency(k.commissions),
      icon: <FaMoneyBillWave size={26} color={theme.palette.warning.contrastText} />,
      color: theme.palette.warning.main,
    },
    {
      title: "Late Deliveries",
      value: dash ?? num(k.lateDeliveries),
      icon: (
        <FaExclamationTriangle size={26} color={theme.palette.error.contrastText} />
      ),
      color: theme.palette.error.main,
    },
  ];

  return (
    <Grid container spacing={2}>
      {tiles.map((metric, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={`kpi-${index}`}>
          <KeyMetricFinancialTile metric={metric} isMobile={isMobile} />
        </Grid>
      ))}
    </Grid>
  );
}
