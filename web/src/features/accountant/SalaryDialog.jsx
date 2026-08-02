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
  Grid,
  TextField,
  CircularProgress,
} from "@mui/material";
import {
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { getData } from "@/app/helpers/functions/getData";
import EditModal from "@/shared/components/models/EditModal.jsx";
import ProcessMonthlySalaryButton from "@/features/accountant/MonthlySalaryDialog.jsx";
import { NotesComponent } from "@/shared/components/common/Notes.jsx";
import { inputs } from "@/features/accountant/config/salaryDialogConfig.js";
import {
  SalaryEmployeeInfoCard,
  MonthlySalariesTable,
} from "@/features/accountant/SalaryDialogSections.jsx";
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
      url: `accounting/salaries/data?userId=${userId}&startDate=${startDate.format(
        "YYYY-MM-DD"
      )}&endDate=${endDate.format("YYYY-MM-DD")}&`,
      setLoading,
    });
    setSalaryData(data);
  };

  const handleDateChange = () => {
    fetchSalaryData();
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
                        href={`accounting/salaries`}
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
                  <SalaryEmployeeInfoCard salaryData={salaryData} />
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

                    <MonthlySalariesTable
                      monthlySalaries={salaryData.monthlySalaries}
                    />
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
