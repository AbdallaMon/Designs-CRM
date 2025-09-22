import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment,
  Paper,
  Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  FaMoneyBillWave,
  FaCalculator,
  FaUserTie,
  FaClock,
  FaCalendarAlt,
  FaDollarSign,
} from "react-icons/fa";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getData } from "@/app/helpers/functions/getData";

const ProcessMonthlySalaryButton = ({ salaryData, setSalaryData }) => {
  const [open, setOpen] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const { setLoading } = useToastContext();
  const [monthlyData, setMonthlyData] = useState();
  const [formData, setFormData] = useState({
    totalHoursWorked: 0,
    overtimeHours: 0,
    bonuses: 0,
    deductions: 0,
    netSalary: parseFloat(salaryData.baseSalary),
    isFulfilled: false,
    paymentDate: null,
  });
  const fetchMonthlyHours = async () => {
    setFetchLoading(true);

    try {
      const res = await getData({
        url: `accountant/users/${salaryData.userId}/last-seen`,
        setLoading: setFetchLoading,
      });
      setMonthlyData(res);
      setFormData({
        totalHoursWorked: parseFloat(res.totalMonthHours),
        overtimeHours: 0,
        bonuses: 0,
        deductions: 0,
        netSalary: salaryData.baseSalary,
        isFulfilled: false,
        paymentDate: null,
      });
    } catch (err) {
      console.error("Error fetching monthly hours:", err);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchMonthlyHours();
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      totalHoursWorked: 0,
      overtimeHours: 0,
      bonuses: 0,
      deductions: 0,
      netSalary: 0,
      isFulfilled: false,
      paymentDate: null,
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      let parsedValue = value;
      console.log(parsedValue, "parse");

      if (
        [
          "totalHoursWorked",
          "overtimeHours",
          "bonuses",
          "deductions",
          "netSalary",
        ].includes(name)
      ) {
        parsedValue = parseFloat(value) || 0;
      }

      setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, paymentDate: date }));
  };

  const handleSubmit = async () => {
    const request = await handleRequestSubmit(
      { ...formData, baseSalaryId: salaryData.id },
      setLoading,
      `accountant/salaries/monthly/pay`,
      false,
      "Paying"
    );
    if (request.status === 200) {
      setSalaryData((old) => ({
        ...old,
        monthlySalaries: [request.data, ...old.monthlySalaries], // Prepend the new salary to the top of the array
      }));
      (old) => ({ ...old });
      handleClose();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={handleOpen}
        startIcon={<FaMoneyBillWave />}
      >
        Process Monthly Salary
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="process-salary-dialog-title"
      >
        <DialogTitle id="process-salary-dialog-title">
          <Box display="flex" alignItems="center">
            <FaMoneyBillWave style={{ marginRight: "10px" }} />
            <Typography variant="h6">Process Monthly Salary</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {fetchLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="300px"
            >
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {/* Employee Information */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <FaUserTie
                    style={{ marginRight: "10px", verticalAlign: "middle" }}
                  />
                  Employee Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Name:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {salaryData.employee.name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="textSecondary">
                      Email:
                    </Typography>
                    <Typography variant="body1">
                      {salaryData.employee.email}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      Base Salary:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatCurrency(salaryData.baseSalary)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      Tax Amount:
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(salaryData.taxAmount)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      Base Work Hours:
                    </Typography>
                    <Typography variant="body1">
                      {salaryData.baseWorkHours} hours
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Monthly Information */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <FaCalendarAlt
                    style={{ marginRight: "10px", verticalAlign: "middle" }}
                  />
                  Monthly Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Period:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {monthlyData?.month}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Total Hours Worked:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {monthlyData?.totalMonthHours} hours
                  </Typography>
                </Box>
              </Paper>

              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <FaCalculator
                    style={{ marginRight: "10px", verticalAlign: "middle" }}
                  />
                  Salary Calculation
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Total Hours Worked"
                      name="totalHoursWorked"
                      type="number"
                      value={formData.totalHoursWorked}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaClock />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Overtime Hours"
                      name="overtimeHours"
                      type="number"
                      value={formData.overtimeHours}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaClock />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Bonuses"
                      name="bonuses"
                      type="number"
                      value={formData.bonuses}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaDollarSign />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Deductions"
                      name="deductions"
                      type="number"
                      value={formData.deductions}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaDollarSign />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Net Salary"
                      name="netSalary"
                      type="number"
                      helperText="This is the total amount that actually paid"
                      value={formData.netSalary}
                      onChange={handleInputChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FaDollarSign />
                          </InputAdornment>
                        ),
                      }}
                      variant="filled"
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Options */}
              <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <FaMoneyBillWave
                    style={{ marginRight: "10px", verticalAlign: "middle" }}
                  />
                  Payment Details
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isFulfilled}
                          onChange={handleInputChange}
                          name="isFulfilled"
                          color="primary"
                        />
                      }
                      label="Does he fulfilled work hours"
                    />
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Payment Date"
                        value={formData.paymentDate}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth />
                        )}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Paper>
              <Button onClick={handleSubmit}>Pay</Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProcessMonthlySalaryButton;
