import React, { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import Link from "next/link";

const PaymentDialog = ({ payments }) => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        View Payments
      </Button>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {payments && payments.length > 0 ? (
            <List>
              {payments.map((payment) => (
                <ListItem key={payment.id} sx={{ bgcolor: "white", mb: 1.2 }}>
                  <ListItemText
                    primary={
                      user.role === "ACCOUNTANT" ? (
                        <Button
                          component={Link}
                          href={`/dashboard?paymentId=${payment.id}`}
                        >
                          Payment #{payment.id} - {payment.status}
                        </Button>
                      ) : (
                        `Payment #${payment.id} - ${
                          isAdmin ? payment.status : ""
                        }`
                      )
                    }
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="text.secondary">
                          {isAdmin ? (
                            <>
                              Amount Left: {payment.amountLeft} | Amount Paid:{" "}
                              {payment.amountPaid}
                            </>
                          ) : (
                            <>
                              Amount :{payment.amountLeft + payment.amountPaid}
                            </>
                          )}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          Payment Reason: {payment.paymentReason}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No payments available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PaymentDialog;
