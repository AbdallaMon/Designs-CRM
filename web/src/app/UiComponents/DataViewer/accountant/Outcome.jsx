"use client";
import React from "react";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import DateRangeFilter from "../../formComponents/DateRangeFilter";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
} from "@mui/material";
import { FaCalendarMonth, FaMoneyBillWave } from "react-icons/fa6";
import dayjs from "dayjs";
import { MdCalendarMonth, MdMoney } from "react-icons/md";
import { IncomeOutcomeSummary } from "./IncomeOutComeSummary";
const columns = [
  { name: "amount", label: "Amount" },
  { name: "type", label: "Type" },
  { name: "description", label: "Description" },
  { name: "createdAt", label: "Paid at", type: "date" },
];

const OutCome = () => {
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setFilters,
  } = useDataFetcher(`accountant/outcome?`);
  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <IncomeOutcomeSummary />
      <Box>
        <DateRangeFilter setFilters={setFilters} lastThreeMonth={true} />
      </Box>
      <AdminTable
        data={data}
        columns={columns}
        loading={loading}
        limit={limit}
        page={page}
        total={total}
        setPage={setPage}
        setLimit={setLimit}
        setTotal={setTotal}
        setData={setData}
        totalPages={totalPages}
      />
    </Container>
  );
};
function OutcomeSummary({ totalAmount, currentMonthAmount }) {
  // Format currency values with AED
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Current month and year using dayjs
  const currentMonthYear = dayjs().format("MMMM YYYY");
  if (!totalAmount) return null;

  return (
    <Box sx={{ mb: 6 }}>
      <Grid container spacing={3}>
        {/* Current Month Box */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              height: 160,
              bgcolor: "#f5f5f5",
              borderLeft: "4px solid #1976d2",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <MdCalendarMonth size={24} color="#1976d2" />
              <Typography variant="h6" sx={{ ml: 1, color: "#555" }}>
                Current Month Expenses
              </Typography>
            </Box>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontWeight: "bold", color: "#1976d2" }}
            >
              {formatCurrency(currentMonthAmount)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, mb: 3 }}
            >
              Total expenses for {currentMonthYear}
            </Typography>
          </Paper>
        </Grid>

        {/* Total Accumulation Box */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              height: 160,
              bgcolor: "#f5f5f5",
              borderLeft: "4px solid #2e7d32",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <MdMoney size={24} color="#2e7d32" />
              <Typography variant="h6" sx={{ ml: 1, color: "#555" }}>
                Total Accumulation
              </Typography>
            </Box>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontWeight: "bold", color: "#2e7d32" }}
            >
              {formatCurrency(totalAmount)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, mb: 3 }}
            >
              {" "}
              All-time expense accumulation
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
export default OutCome;
