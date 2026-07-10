import React from "react";
import {
  TextField,
  Box,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  InputAdornment,
  Paper,
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
import { formatCurrency } from "@/app/helpers/functions/utility";

export const EmployeeInformationPanel = ({ salaryData }) => {
  return (
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
  );
};

export const MonthlyInformationPanel = ({ monthlyData }) => {
  return (
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
  );
};

export const SalaryCalculationPanel = ({ formData, handleInputChange }) => {
  return (
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
  );
};

export const PaymentDetailsPanel = ({
  formData,
  handleInputChange,
  handleDateChange,
}) => {
  return (
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
  );
};
