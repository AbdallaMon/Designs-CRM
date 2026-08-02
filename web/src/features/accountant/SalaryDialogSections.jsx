"use client";
import React from "react";
import {
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import dayjs from "dayjs";
import { formatCurrency } from "@/app/helpers/functions/utility";

export const SalaryEmployeeInfoCard = ({ salaryData }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6">
          {salaryData.employee.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {salaryData.employee.email}
        </Typography>
        <Chip
          label={salaryData.employee.currentProfile?.label ?? "No active profile"}
          color="primary"
          size="small"
          sx={{ mt: 1 }}
        />
      </Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" gutterBottom>
        <FaUserTie
          style={{ marginRight: "10px", verticalAlign: "middle" }}
        />
        Base Salary Information
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid size={6}>
            <Typography variant="body2" color="textSecondary">
              Base Salary:
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1" fontWeight="bold">
              {formatCurrency(salaryData.baseSalary)}
            </Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body2" color="textSecondary">
              Tax Amount:
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1">
              {formatCurrency(salaryData.taxAmount)}
            </Typography>
          </Grid>

          <Grid size={6}>
            <Typography variant="body2" color="textSecondary">
              Base Work Hours:
            </Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="body1">
              {salaryData.baseWorkHours} hours
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export const MonthlySalariesTable = ({ monthlySalaries }) => {
  return monthlySalaries.length > 0 ? (
    <TableContainer component={Paper} elevation={0}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Month</TableCell>
            <TableCell>Hours</TableCell>
            <TableCell>Overtime</TableCell>
            <TableCell>Bonuses</TableCell>
            <TableCell>Deductions</TableCell>
            <TableCell>Net Salary</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {monthlySalaries.map((salary) => (
            <TableRow key={salary.id}>
              <TableCell>
                {dayjs(salary.createdAt).format("MMM YYYY")}
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <FaClock style={{ marginRight: "5px" }} />
                  {salary.totalHoursWorked}
                </Box>
              </TableCell>
              <TableCell>{salary.overtimeHours}</TableCell>
              <TableCell>
                {formatCurrency(salary.bonuses)}
              </TableCell>
              <TableCell>
                {formatCurrency(salary.deductions)}
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                {formatCurrency(salary.netSalary)}
              </TableCell>
              <TableCell>
                {salary.isFulfilled ? (
                  <Chip
                    icon={<FaCheckCircle />}
                    label="Fulfilled"
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<FaTimesCircle />}
                    label="Didnot fulfilled"
                    color="warning"
                    size="small"
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  ) : (
    <Box py={3} textAlign="center">
      <Typography color="textSecondary">
        No salary records found for the selected date range.
      </Typography>
    </Box>
  );
};
