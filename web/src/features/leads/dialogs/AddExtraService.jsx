"use client";
import React, { useEffect, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { FaMoneyBillWave } from "react-icons/fa";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";

import dayjs from "dayjs";
import AddPayments from "@/features/leads/payments/AddPayments.jsx";

import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const AddExtraService = ({
  lead,
  setExtraServices,
  type = "button",
  children,
  setPayments,
  onAdded,
}) => {
  const [extraService, setExtraService] = useState({
    note: null,
    price: 0,
    paymentReason: null,
  });
  const [open, setOpen] = useState(false);
  const { setAlertError } = useAlertContext();
  const [openPayments, setOpenPayments] = useState(false);
  const theme = useTheme();
  function handleOpen() {
    setOpen(true);
  }
  function onClose(close) {
    if (close) {
      // Optimistically show the new service right away, then reconcile from the server
      // (onAdded refetches the core lead, which carries the authoritative list + real id).
      setExtraServices?.((old) => [
        { ...extraService, id: `temp-${Date.now()}` },
        ...(old || []),
      ]);
      onAdded?.();
    }
    setExtraService({ note: null, price: 0, paymentReason: null });
    setOpen(false);
  }
  const handleAddNewExtraService = async () => {
    if (!extraService.price || !extraService.paymentReason) {
      setAlertError("You must enter payment reason and price");
      return;
    }
    if (extraService.price <= 0) {
      setAlertError("You must a price bigger than 0");
      return;
    }
    setOpenPayments(true);
  };

  return (
    <>
      {openPayments && (
        <AddPayments
          lead={lead}
          onClose={onClose}
          open={openPayments}
          paymentType="extra-service"
          setOpen={setOpenPayments}
          totalAmount={extraService.price}
          extraData={extraService}
          setOldPayments={setPayments}
        />
      )}
      {type === "button" ? (
        <Button
          onClick={handleOpen}
          variant="contained"
          startIcon={<BsPlus size={20} />}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600 }}
        >
          Add extra service
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider", py: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  fontSize: 18,
                }}
              >
                <FaMoneyBillWave />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  New Extra Service
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Bill additional work for this lead
                </Typography>
              </Box>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ "&.MuiDialogContent-root": { pt: 4 } }}>
            <Stack spacing={3}>
              <TextField
                label="Price"
                value={extraService.price}
                onChange={(e) =>
                  setExtraService({ ...extraService, price: e.target.value })
                }
                fullWidth
                type="number"
              />
              <TextField
                label="Payment Reason"
                value={extraService.note}
                onChange={(e) =>
                  setExtraService({
                    ...extraService,
                    paymentReason: e.target.value,
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Note"
                value={extraService.note}
                onChange={(e) =>
                  setExtraService({ ...extraService, note: e.target.value })
                }
                fullWidth
                multiline
                minRows={3}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: 1, borderColor: "divider" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddNewExtraService}
              variant="contained"
              color="primary"
              sx={{ textTransform: "none", fontWeight: 600, px: 3 }}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
