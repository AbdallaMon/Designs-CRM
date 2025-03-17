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
  Grid2 as Grid,
} from "@mui/material";
import { FaCalendarMonth, FaMoneyBillWave } from "react-icons/fa6";
import dayjs from "dayjs";
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
    extraData,
    setFilters,
  } = useDataFetcher(`accountant/outcome?`);
  console.log(extraData, "extraData");
  return (
    <Container maxWidth="xxl" px={{ xs: 2, md: 4 }}>
      <OutcomeSummary
        totalAmount={extraData?.totalAmount}
        currentMonthAmount={extraData?.currentMonthAmount}
      />
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
const OutcomeSummary = ({ totalAmount, currentMonthAmount }) => {
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Current Month Box */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              height: 140,
              bgcolor: "#f5f5f5",
              borderLeft: "4px solid #1976d2",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <FaCalendarMonth size={24} color="#1976d2" />
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
              height: 140,
              bgcolor: "#f5f5f5",
              borderLeft: "4px solid #2e7d32",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <FaMoneyBillWave size={24} color="#2e7d32" />
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
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              All-time expense accumulation
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
export default OutCome;
