import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from "@mui/material";

import { getData } from "@/app/helpers/functions/getData";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import {
  MdCheckCircle,
  MdClose,
  MdPendingActions,
} from "react-icons/md";
import { useAlertContext } from "@/app/providers/MuiAlert";
import { NotesComponent } from "@/app/UiComponents/DataViewer/utility/Notes.jsx";
import AdminCommissionForm from "@/app/UiComponents/DataViewer/utility/AdminCommissionForm.jsx";

const Commission = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { setLoading: setToastLoading } = useToastContext();
  const { setAlertError } = useAlertContext();
  const handleOpen = () => {
    setOpen(true);
    fetchCommissions();
  };

  const handleClose = () => {
    setOpen(false);
  };

  const fetchCommissions = async () => {
    setLoading(true);
    const response = await getData({
      url: `admin/commissions?userId=${userId}&`,
      setLoading,
    });
    if (response && response.status === 200) {
      setCommissions(response.data);
    } else {
      setAlertError("Failed to load commissions");
    }
    setLoading(false);
  };

  const openPaymentModal = (commission) => {
    setSelectedCommission(commission);
    setPaymentAmount("");
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setSelectedCommission(null);
  };

  const handlePayment = async () => {
    if (
      !paymentAmount ||
      isNaN(parseFloat(paymentAmount)) ||
      parseFloat(paymentAmount) <= 0
    ) {
      setAlertError("Please enter a valid amount");
      return;
    }

    const remainingAmount =
      parseFloat(selectedCommission.amount) -
      parseFloat(selectedCommission.amountPaid);
    if (parseFloat(paymentAmount) > remainingAmount) {
      setAlertError(
        `Amount cannot exceed the remaining balance of ${remainingAmount}`
      );
      return;
    }

    const request = await handleRequestSubmit(
      { amount: paymentAmount },
      setToastLoading,
      `admin/commissions/${selectedCommission.id}`,
      false,
      "Updating",
      null,
      "PUT"
    );

    if (request.status === 200) {
      setCommissions((prev) =>
        prev.map((commission) => {
          if (commission.id === selectedCommission.id) {
            return request.data;
          }
          return commission;
        })
      );
      closePaymentModal();
    }
  };

  const updateCommissionAfterCreate = (newCommission) => {
    setCommissions((prev) => [newCommission, ...prev]);
  };
  const formatCurrency = (value) => {
    return value;
  };

  return (
    <>
      <Button
        variant="contained"
        fullWidth
        color="primary"
        onClick={handleOpen}
      >
        Staff Commissions
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Staff Commissions</Typography>

            <IconButton onClick={handleClose} size="small">
              <MdClose />
            </IconButton>
          </Box>
          <Box mt={1}>
            <AdminCommissionForm
              userId={userId}
              onUpdate={updateCommissionAfterCreate}
            />
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : !commissions || commissions.length === 0 ? (
            <Typography align="center">No commissions found</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client</TableCell>
                    <TableCell>Lead ID</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Commission Reason</TableCell>
                    <TableCell align="center">Action</TableCell>
                    <TableCell align="center">Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commissions.map((commission) => {
                    const remaining =
                      parseFloat(commission.amount) -
                      parseFloat(commission.amountPaid);

                    return (
                      <TableRow key={commission.id}>
                        <TableCell>
                          {commission.lead?.client?.name || "N/A"}
                        </TableCell>
                        <TableCell>{commission.leadId}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(commission.amount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(commission.amountPaid)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell align="center">
                          {commission.isCleared ? (
                            <Chip
                              icon={<MdCheckCircle fontSize="small" />}
                              label="Cleared"
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<MdPendingActions fontSize="small" />}
                              label="Pending"
                              color="warning"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {commission.commissionReason || "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          {!commission.isCleared && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              disabled={remaining <= 0}
                              onClick={() => openPaymentModal(commission)}
                            >
                              Pay
                            </Button>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <NotesComponent
                            idKey={"commissionId"}
                            id={commission.id}
                            slug="shared"
                            showAddNotes={true}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentModalOpen}
        onClose={closePaymentModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Process Payment</Typography>
            <IconButton onClick={closePaymentModal} size="small">
              <MdClose />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedCommission && (
            <>
              <Typography gutterBottom>
                Lead ID: {selectedCommission.leadId}
              </Typography>
              <Typography gutterBottom>
                Total Amount: {formatCurrency(selectedCommission.amount)}
              </Typography>
              <Typography gutterBottom>
                Remaining:{" "}
                {formatCurrency(
                  parseFloat(selectedCommission.amount) -
                    parseFloat(selectedCommission.amountPaid)
                )}
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="Payment Amount"
                type="number"
                fullWidth
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closePaymentModal} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            color="primary"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Process Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Commission;
