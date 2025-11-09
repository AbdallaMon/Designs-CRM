"use client";
import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { BsPlus } from "react-icons/bs";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";

import dayjs from "dayjs";
import AddPayments from "../payments/AddPayments";

import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const AddExtraService = ({
  lead,
  setExtraServices,
  type = "button",
  children,
  setPayments,
}) => {
  const [extraService, setExtraService] = useState({
    note: null,
    price: 0,
    paymentReason: null,
  });
  const [open, setOpen] = useState(false);
  const { setAlertError } = useAlertContext();
  const [openPayments, setOpenPayments] = useState(false);
  function handleOpen() {
    setOpen(true);
  }
  function onClose(close) {
    setExtraService({ note: null, price: 0 });
    setOpen(false);
    if (close) {
      // setExtraServices((old) => [...old, extraService]);
      window.location.reload();
    }
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
          sx={{ alignSelf: "flex-start" }}
        >
          Add extra service
        </Button>
      ) : (
        <OpenButton handleOpen={handleOpen}>{children}</OpenButton>
      )}
      {open && (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
            New Service
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 2 }}>
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
                rows={3}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleAddNewExtraService}
              variant="contained"
              color="primary"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
