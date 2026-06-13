"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import { Box, Paper, Typography, Grid } from "@mui/material";
import {
  MdCalendarMonth,
  MdAttachMoney,
  MdTrendingUp,
  MdTrendingDown,
  MdMoney,
} from "react-icons/md";
import dayjs from "dayjs";

export function IncomeOutcomeSummary() {
  const { data } = useDataFetcher(`accountant/summary?`);

  // Format currency values with AED
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Get Current Month and Year
  const currentMonthYear = dayjs().format("MMMM YYYY");

  // Card Component for Reusability
  const StatCard = ({ title, value, description, icon, color }) => (
    <Grid size={{ xs: 12, md: 6 }}>
      <Paper
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          height: 160,
          bgcolor: color.bg,
          borderLeft: `6px solid ${color.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1, color: color.text }}>
            {title}
          </Typography>
        </Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: color.value }}
        >
          {formatCurrency(value)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      </Paper>
    </Grid>
  );

  return (
    <Box sx={{ mb: 6 }}>
      <Grid container spacing={3}>
        {/* Current Month Income */}
        <StatCard
          title="Current Month Income"
          value={data?.currentMonthIncome}
          description={`Total income for ${currentMonthYear}`}
          icon={<MdTrendingUp size={26} color="#2e7d32" />}
          color={{
            bg: "#e8f5e9",
            border: "#2e7d32",
            text: "#2e7d32",
            value: "#1b5e20",
          }}
        />

        {/* Total Income Accumulation */}
        <StatCard
          title="Total Income Accumulation"
          value={data?.totalIncome}
          description="All-time income accumulation"
          icon={<MdAttachMoney size={26} color="#388e3c" />}
          color={{
            bg: "#f1f8e9",
            border: "#388e3c",
            text: "#388e3c",
            value: "#1b5e20",
          }}
        />

        {/* Current Month Expenses */}
        <StatCard
          title="Current Month Expenses"
          value={data?.currentMonthOutcome}
          description={`Total expenses for ${currentMonthYear}`}
          icon={<MdTrendingDown size={26} color="#d32f2f" />}
          color={{
            bg: "#ffebee",
            border: "#d32f2f",
            text: "#d32f2f",
            value: "#b71c1c",
          }}
        />

        {/* Total Outcome Accumulation */}
        <StatCard
          title="Total Expenses Accumulation"
          value={data?.totalOutcome}
          description="All-time expenses accumulation"
          icon={<MdMoney size={26} color="#c62828" />}
          color={{
            bg: "#fbe9e7",
            border: "#c62828",
            text: "#c62828",
            value: "#b71c1c",
          }}
        />
      </Grid>
    </Box>
  );
}
