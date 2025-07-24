import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  MdPayment as Payment,
  MdPersonAdd as PersonAdd,
  MdSend as Send,
} from "react-icons/md";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

const ReminderButtons = ({ lead, clientLeadId }) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const { loading, setLoading } = useToastContext();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  if (!isAdmin) return;

  const handlePaymentReminder = async () => {
    const req = await handleRequestSubmit(
      { clientLeadId },
      setLoading,
      `shared/client-leads/${clientLeadId}/payment-reminder`,
      false,
      "Sending"
    );
    if (req.status === 200) {
      setPaymentDialogOpen(false);
    }
  };

  const handleRegisterReminder = async () => {
    const req = await handleRequestSubmit(
      { clientLeadId },
      setLoading,
      `shared/client-leads/${clientLeadId}/complete-register`,
      false,
      "Sending"
    );
    if (req.status === 200) {
      setRegisterDialogOpen(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ display: "flex", gap: 2, p: 0 }}>
      {lead.paymentStatus !== "FULLY_PAID" && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<Payment />}
          onClick={() => setPaymentDialogOpen(true)}
          disabled={loading}
          sx={{
            minWidth: 180,
            height: 48,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Send Payment Reminder
        </Button>
      )}
      {lead.paymentStatus === "FULLY_PAID" &&
        lead.description === "Didn't complete register yet" && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PersonAdd />}
            onClick={() => setRegisterDialogOpen(true)}
            disabled={loading}
            sx={{
              minWidth: 180,
              height: 48,
              borderRadius: 2,
              textTransform: "none",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Send Registration Reminder
          </Button>
        )}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Payment color="primary" />
          Confirm Payment Reminder
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to send a payment reminder to this client?
            This will notify them about their pending payment.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setPaymentDialogOpen(false)}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentReminder}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          >
            {loading ? "Sending..." : "Send Reminder"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PersonAdd color="secondary" />
          Confirm Registration Reminder
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to send a registration completion reminder to
            this client? This will notify them to complete their registration
            process.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setRegisterDialogOpen(false)}
            variant="outlined"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegisterReminder}
            variant="contained"
            color="secondary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          >
            {loading ? "Sending..." : "Send Reminder"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReminderButtons;
