import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Grid2 as Grid,
  Dialog,
  DialogContent,
  Container,
  DialogActions,
} from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";

const locales = ["en-gb"];

// Constants for payment intervals
const PayEveryType = {
  ONE_MONTH: 1,
  TWO_MONTHS: 2,
  THREE_MONTHS: 3,
  FOUR_MONTHS: 4,
  SIX_MONTHS: 6,
  ONE_YEAR: 12,
};

function AddPayments({
  open,
  setOpen,
  lead,
  onClose,
  setOldPayments,
  totalAmount,
  paymentType,
  extraData,
}) {
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [range, setRange] = useState({ startDate: null, endDate: null });
  const [payEvery, setPayEvery] = useState(3);
  const { setLoading } = useToastContext();

  const calculateInstallments = () => {
    if (!range.startDate || !range.endDate || !totalAmount) return;

    const start = dayjs(range.startDate);
    const end = dayjs(range.endDate);
    const months = end.diff(start, "month");

    if (months <= 0) {
      setError("Make sure date range are correct");
      return;
    }

    const numPayments = Math.ceil(months / payEvery);
    const installmentAmount = totalAmount / numPayments;
    let remainingAmount = totalAmount;
    const newPayments = Array(numPayments)
      .fill()
      .map((_, index) => {
        const dueDate = start.add(index * payEvery, "month");
        const installmentAmountForCurrentPayment =
          index === numPayments - 1
            ? remainingAmount
            : Math.floor(installmentAmount);
        remainingAmount -= installmentAmountForCurrentPayment;
        return {
          dueDate: dueDate.format("YYYY-MM-DD"),
          amount: installmentAmountForCurrentPayment,
        };
      });

    setPayments(newPayments);
  };

  useEffect(() => {
    if (range.startDate && range.endDate && payEvery && totalAmount) {
      calculateInstallments();
    }
  }, [range, totalAmount, payEvery]);

  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...payments];
    updatedPayments[index][field] = value;
    setPayments(updatedPayments);
  };

  // Validate and handle the form submission
  const onSubmit = async () => {
    if (payments.length === 0) {
      setError("Please recheck the fields");
      return;
    }
    const totalPayments = payments.reduce(
      (acc, payment) => acc + parseFloat(payment.amount),
      0
    );

    if (totalPayments !== parseInt(totalAmount)) {
      setError(
        `The total payments (${totalPayments}) do not match the final price agreed upon the client (${totalAmount}).`
      );

      return;
    }
    const startDate = dayjs(range.startDate);
    const endDate = dayjs(range.endDate);

    const invalidDate = payments.some((payment) => {
      const dueDate = dayjs(payment.dueDate);
      return dueDate.isBefore(startDate) || dueDate.isAfter(endDate);
    });

    if (invalidDate) {
      setError(
        "Make sure that all due dates fall within the start date and end date range."
      );

      return;
    }

    const request = await handleRequestSubmit(
      {
        totalAmounts: totalPayments,
        payments,
        payEvery,
        startDate,
        endDate,
        paymentType,
        ...extraData,
      },
      setLoading,
      `shared/client-leads/${lead.id}/payments`,
      false,
      "Submitting"
    );
    if (request.status === 200) {
      if (setOldPayments) {
        setOldPayments((old) => [...old, ...request.data]);
      }
      if (onClose) {
        onClose(true);
      }
      setOpen(false);
    }
  };

  const isSubmitDisabled =
    !totalAmount || !range.startDate || !range.endDate || payments.length === 0;
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Add payments
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen // This makes the dialog take the full page
        aria-labelledby="full-screen-dialog-title"
        aria-describedby="full-screen-dialog-description"
      >
        <DialogContent>
          <Container maxWidth="md">
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale={locales}
            >
              <Typography variant="h4" gutterBottom>
                Add new payments
              </Typography>
              <Box mt={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <FormControl
                      fullWidth
                      sx={(theme) => ({
                        backgroundColor: theme.palette.background.default,
                      })}
                      variant="outlined"
                    >
                      <InputLabel id="payEvery-label">Pay every</InputLabel>
                      <Select
                        value={payEvery}
                        onChange={(e) => setPayEvery(parseInt(e.target.value))}
                        fullWidth
                        labelId="payEvery-label"
                        label="Pay every"
                        id="payEvery"
                      >
                        <MenuItem value={PayEveryType.ONE_MONTH}>
                          Every month
                        </MenuItem>
                        <MenuItem value={PayEveryType.TWO_MONTHS}>
                          Every two months
                        </MenuItem>
                        <MenuItem value={PayEveryType.THREE_MONTHS}>
                          Every three months{" "}
                        </MenuItem>
                        <MenuItem value={PayEveryType.FOUR_MONTHS}>
                          Every four months{" "}
                        </MenuItem>
                        <MenuItem value={PayEveryType.SIX_MONTHS}>
                          Every six months
                        </MenuItem>
                        <MenuItem value={PayEveryType.ONE_YEAR}>
                          Every year
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl
                      fullWidth
                      sx={{ bgcolor: "background.default" }}
                      margin={"none"}
                    >
                      <DatePicker
                        label="Payments start date"
                        value={
                          range.startDate
                            ? dayjs(range.startDate).locale("en-gb")
                            : null
                        }
                        onChange={(date) => {
                          setRange({
                            ...range,
                            startDate: date ? date.format("YYYY-MM-DD") : null,
                          });
                        }}
                        slotProps={{
                          textField: {
                            error: !!error,
                            inputProps: {
                              placeholder: "DD/MM/YYYY",
                            },
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl
                      fullWidth
                      sx={{ bgcolor: "background.default" }}
                      margin={"none"}
                    >
                      <DatePicker
                        label="Payments end date"
                        fullWidth
                        sx={{ bgcolor: "background.default" }}
                        value={
                          range.endDate
                            ? dayjs(range.endDate).locale("en-gb")
                            : null
                        }
                        onChange={(date) => {
                          setRange({
                            ...range,
                            endDate: date ? date.format("YYYY-MM-DD") : null,
                          });
                        }}
                        slotProps={{
                          textField: {
                            error: !!error,
                            inputProps: {
                              placeholder: "DD/MM/YYYY",
                            },
                          },
                        }}
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {range.startDate && range.endDate && payments.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6">Payments:</Typography>
                  <Grid container spacing={2}>
                    {payments.map((payment, index) => (
                      <Grid
                        size={{ xs: 12, md: 6 }}
                        key={index}
                        mb={3}
                        p={3}
                        border={1}
                        borderRadius={2}
                        borderColor="grey.300"
                      >
                        <Typography variant="h6" mb={2}>
                          Payment number {index + 1}
                        </Typography>
                        <FormControl
                          fullWidth
                          sx={{ bgcolor: "background.default" }}
                          margin={"none"}
                        >
                          <DatePicker
                            label="Due Date"
                            sx={{ bgcolor: "background.default" }}
                            value={
                              payment.dueDate
                                ? dayjs(payment.dueDate).locale("en-gb")
                                : null
                            }
                            onChange={(date) => {
                              const newData = date
                                ? date.format("YYYY-MM-DD")
                                : null;
                              handlePaymentChange(index, "dueDate", newData);
                            }}
                            slotProps={{
                              textField: {
                                error: !!error,
                                inputProps: {
                                  placeholder: "DD/MM/YYYY",
                                },
                              },
                            }}
                          />
                        </FormControl>
                        <TextField
                          label="Amount"
                          type="number"
                          value={payment.amount}
                          onChange={(e) =>
                            handlePaymentChange(index, "amount", e.target.value)
                          }
                          fullWidth
                          sx={{ mt: 2 }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Submit Data Button */}
              <Button
                variant="contained"
                color="secondary"
                onClick={onSubmit}
                sx={{ mt: 2 }}
                disabled={isSubmitDisabled}
              >
                Save{" "}
              </Button>

              {/* Snackbar for Errors */}
              <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  onClose={() => setError(null)}
                  severity="error"
                  variant="filled"
                >
                  {error}
                </Alert>
              </Snackbar>
            </LocalizationProvider>
          </Container>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AddPayments;
