"use client";
import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Typography,
  Box,
  Grid2 as Grid,
  Avatar,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaUserTie,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { getData } from "@/app/helpers/functions/getData";
import EditModal from "../../models/EditModal";
import ProcessMonthlySalaryButton from "./MonthlySalaryDialog";
import { NotesComponent } from "../utility/Notes";
const inputs = [
  {
    data: {
      id: "baseSalary",
      type: "number",
      label: "Base salary",
      key: "baseSalary.baseSalary",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a Base salary",
      },
    },
  },
  {
    data: {
      id: "baseWorkHours",
      type: "number",
      label: "Base work hours",
      key: "baseSalary.baseWorkHours",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a Base work hours",
      },
    },
  },
  {
    data: {
      id: "taxAmount",
      type: "number",
      label: "Tax amount",
      key: "baseSalary.taxAmount",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a tax amount",
      },
    },
  },
];
const SalaryInfoButton = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    dayjs().subtract(1, "year").startOf("month")
  );
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));

  const handleOpen = () => {
    setOpen(true);
    fetchSalaryData();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const fetchSalaryData = async () => {
    const data = await getData({
      url: `accountant/salaries/data?userId=${userId}&startDate=${startDate.format(
        "YYYY-MM-DD"
      )}&endDate=${endDate.format("YYYY-MM-DD")}&`,
      setLoading,
    });
    setSalaryData(data);
  };

  const handleDateChange = () => {
    fetchSalaryData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<FaFileInvoiceDollar />}
      >
        View Salary Information
      </Button>

      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        aria-labelledby="salary-dialog-title"
      >
        <DialogTitle id="salary-dialog-title">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h5">
              <FaMoneyBillWave
                style={{ marginRight: "10px", verticalAlign: "middle" }}
              />
              Salary Information
            </Typography>
            <Button variant="outlined" onClick={handleClose}>
              Close
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent>
          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="300px"
            >
              <CircularProgress />
            </Box>
          ) : salaryData ? (
            <>
              <Grid container spacing={3}>
                {/* Date Filter */}
                <Grid size={12}>
                  <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <FaCalendarAlt
                        style={{ marginRight: "10px", verticalAlign: "middle" }}
                      />
                      Date Filter
                    </Typography>
                    <Box
                      display="flex"
                      flexDirection={{ xs: "column", sm: "row" }}
                      gap={2}
                    >
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Start Date"
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          renderInput={(params) => (
                            <TextField {...params} fullWidth />
                          )}
                        />
                        <DatePicker
                          label="End Date"
                          value={endDate}
                          onChange={(newValue) => setEndDate(newValue)}
                          renderInput={(params) => (
                            <TextField {...params} fullWidth />
                          )}
                        />
                      </LocalizationProvider>
                      <Button
                        variant="contained"
                        onClick={handleDateChange}
                        sx={{ height: { sm: "56px" } }}
                      >
                        Apply Filter
                      </Button>

                      <EditModal
                        editButtonText={"Edit Base salary"}
                        item={salaryData}
                        inputs={inputs}
                        isObject={true}
                        href={`accountant/salaries`}
                        handleAfterEdit={(req) => {
                          setSalaryData((old) => ({
                            ...old,
                            baseSalary: +req.baseSalary,
                            taxAmount: +req.taxAmount,
                            baseWorkHours: +req.baseWorkHours,
                          }));
                        }}
                        extraProps={{
                          formTitle: "Change base salary",
                          btnText: "Change",
                          variant: "outlined",
                        }}
                      />
                      <ProcessMonthlySalaryButton
                        salaryData={salaryData}
                        setSalaryData={setSalaryData}
                      />
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <NotesComponent
                          showAddNotes={true}
                          idKey={"baseEmployeeSalaryId"}
                          id={salaryData.id}
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>

                {/* Employee Information */}
                <Grid size={{ xs: 12, md: 4 }}>
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
                        label={salaryData.employee.role}
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
                </Grid>

                {/* Monthly Salaries */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <FaCalendarAlt
                        style={{ marginRight: "10px", verticalAlign: "middle" }}
                      />
                      Monthly Salaries
                    </Typography>

                    {salaryData.monthlySalaries.length > 0 ? (
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
                            {salaryData.monthlySalaries.map((salary) => (
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
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="300px"
            >
              <Typography color="textSecondary">No data available</Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalaryInfoButton;
