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
  const [dialogOpen, setDialogOpen] = useState(null);
  const { user } = useAuth();
  const { loading, setLoading } = useToastContext();

  if (!checkIfAdmin(user)) return null;

  const handleReminder = async (type) => {
    const endpoint =
      type === "payment"
        ? `shared/client-leads/${clientLeadId}/payment-reminder`
        : `shared/client-leads/${clientLeadId}/complete-register`;

    const req = await handleRequestSubmit(
      { clientLeadId },
      setLoading,
      endpoint,
      false,
      "Sending"
    );

    if (req.status === 200) {
      setDialogOpen(null);
    }
  };

  const showPaymentBtn = lead.paymentStatus !== "FULLY_PAID";
  const showRegisterBtn =
    lead.paymentStatus === "FULLY_PAID" &&
    lead.description === "Didn't complete register yet";

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {showPaymentBtn && (
        <Button
          variant="contained"
          size="small"
          startIcon={<Payment />}
          onClick={() => setDialogOpen("payment")}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          Payment Reminder
        </Button>
      )}

      {showRegisterBtn && (
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<PersonAdd />}
          onClick={() => setDialogOpen("register")}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          Registration Reminder
        </Button>
      )}

      <Dialog
        open={!!dialogOpen}
        onClose={() => setDialogOpen(null)}
        maxWidth="xs"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {dialogOpen === "payment" ? <Payment /> : <PersonAdd />}
          Confirm {dialogOpen === "payment" ? "Payment" : "Registration"}{" "}
          Reminder
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Send a{" "}
            {dialogOpen === "payment" ? "payment" : "registration completion"}{" "}
            reminder to this client?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(null)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => handleReminder(dialogOpen)}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          >
            {loading ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReminderButtons;
