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
  DialogTitle,
  IconButton,
} from "@mui/material";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { MdClose } from "react-icons/md";
import colors from "@/app/helpers/colors";

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
  fullButtonWidth,
}) {
  const [error, setError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payEvery, setPayEvery] = useState(0);
  const { setLoading } = useToastContext();

  const calculateInstallments = () => {
    if (!payEvery || !totalAmount) return;
    if (payEvery < 1) return;
    const numPayments = +payEvery;
    const installmentAmount = totalAmount / numPayments;
    let remainingAmount = totalAmount;
    const newPayments = Array(numPayments)
      .fill()
      .map((_, index) => {
        const installmentAmountForCurrentPayment =
          index === numPayments - 1
            ? remainingAmount
            : Math.floor(installmentAmount);
        remainingAmount -= installmentAmountForCurrentPayment;
        return {
          amount: installmentAmountForCurrentPayment,
          paymentReason: "",
        };
      });

    setPayments(newPayments);
  };

  useEffect(() => {
    if (payEvery && totalAmount) {
      calculateInstallments();
    }
  }, [totalAmount, payEvery]);

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
    const checkIfPaymentReasonsAreEmpty = payments.some(
      (payment) => payment.paymentReason === ""
    );
    if (checkIfPaymentReasonsAreEmpty) {
      setError("Please fill in all payment reasons");
      return;
    }
    const request = await handleRequestSubmit(
      {
        totalAmounts: totalPayments,
        payments,
        payEvery,
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

  const isSubmitDisabled = !totalAmount || payments.length === 0;
  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        fullWidth={fullButtonWidth}
      >
        Add payments
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullScreen // This makes the dialog take the full page
        aria-labelledby="full-screen-dialog-title"
        aria-describedby="full-screen-dialog-description"
      >
        <DialogTitle
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h4" gutterBottom>
            Add new payments
          </Typography>
          <IconButton onClick={() => setOpen(false)}>
            <MdClose />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Container
            maxWidth="lg"
            sx={{
              background: colors.bgSecondary,
              p: 2,
            }}
          >
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale={locales}
            >
              <Box mt={3}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 12 }}>
                    <TextField
                      id="payEvery"
                      label="Payments number"
                      type="number"
                      onChange={(e) => {
                        if (e.target.value < 1) {
                          return;
                        }
                        setPayEvery(e.target.value);
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {payments.length > 0 && (
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

                        <TextField
                          label="Payment Reason"
                          type="text"
                          value={payment.paymentReason}
                          onChange={(e) =>
                            handlePaymentChange(
                              index,
                              "paymentReason",
                              e.target.value
                            )
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
          <Button variant="contained" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AddPayments;
