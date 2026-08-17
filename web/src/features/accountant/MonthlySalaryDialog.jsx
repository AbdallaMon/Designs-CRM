import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import { FaMoneyBillWave } from "react-icons/fa";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { getData } from "@/app/helpers/functions/getData";
import { USER_FEEDBACK_MESSAGES as FEEDBACK } from "@dms/shared";
import {
  EmployeeInformationPanel,
  MonthlyInformationPanel,
  SalaryCalculationPanel,
  PaymentDetailsPanel,
} from "@/features/accountant/MonthlySalaryPanels.jsx";

const ProcessMonthlySalaryButton = ({ salaryData, setSalaryData }) => {
  const [open, setOpen] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const { setLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
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
        url: `accounting/users/${salaryData.userId}/last-seen`,
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
    if (!(parseFloat(formData.totalHoursWorked) > 0)) {
      setAlertError(FEEDBACK.TOTAL_HOURS_MUST_BE_POSITIVE);
      return;
    }
    if (!(parseFloat(formData.netSalary) > 0)) {
      setAlertError(FEEDBACK.NET_SALARY_MUST_BE_POSITIVE);
      return;
    }
    if (!formData.paymentDate) {
      setAlertError(FEEDBACK.SELECT_PAYMENT_DATE);
      return;
    }
    const request = await handleRequestSubmit(
      { ...formData, baseSalaryId: salaryData.id },
      setLoading,
      `accounting/salaries/monthly/pay`,
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
              <EmployeeInformationPanel salaryData={salaryData} />

              {/* Monthly Information */}
              <MonthlyInformationPanel monthlyData={monthlyData} />

              <SalaryCalculationPanel
                formData={formData}
                handleInputChange={handleInputChange}
              />

              {/* Payment Options */}
              <PaymentDetailsPanel
                formData={formData}
                handleInputChange={handleInputChange}
                handleDateChange={handleDateChange}
              />
              <Button onClick={handleSubmit}>Pay</Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProcessMonthlySalaryButton;
