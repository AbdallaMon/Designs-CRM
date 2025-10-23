import React, { useEffect, useState } from "react";
import { useAlertContext } from "@/app/providers/MuiAlert.jsx";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import LeadContractList from "../contracts/ContractsList";
import ViewContract from "../contracts/ViewContract";

export function FinalizeModal({
  open,
  setOpen,
  id,
  setleads,
  setId,
  setLead,
  setAnchorEl,
  updatePrice,
  lead,
  onUpdate,
}) {
  const [price, setPrice] = useState(lead.priceWithOutDiscount);
  const [discount, setDiscount] = useState(lead.discount);
  const [priceNote, setPriceNote] = useState(lead.priceNote);
  const [averagePrice, setAveragePrice] = useState(lead.averagePrice);
  const { setAlertError } = useAlertContext();
  const { setLoading } = useToastContext();
  const { user } = useAuth();

  // currentContract will be filled by <ViewContract/> via updateOuterContract
  const [currentContract, setCurrentContract] = useState({});

  // extra: small confirm dialog state (minimal + reusable)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMeta, setConfirmMeta] = useState({
    title: "",
    message: "",
    severity: "info", // "info" | "warning"
    run: null, // function to run on confirm
  });

  const [formData, setFormData] = useState({
    purpose: "",
    contractLevel: [],
    startDate: "",
    endDate: "",
  });

  function updateOuterContract(current) {
    setCurrentContract(current || {});
  }

  // keeps your original "create contract first time" logic intact
  const handleSaveContract = async () => {
    if (
      !formData.purpose ||
      !formData.contractLevel ||
      formData.contractLevel.length < 1
    ) {
      setAlertError("Please fill in all required fields.");
      return false;
    }

    const url = `shared/client-leads/${lead.id}/contracts`;
    const method = "POST";

    const req = await handleRequestSubmit(
      formData,
      setLoading,
      url,
      false,
      "Saving Contract",
      false,
      method
    );

    if (req.status === 200 || req.status === 201) return true;
    return false;
  };

  useEffect(() => {
    if (discount >= 0 && price > 0) {
      const discountValue = (Number(price) * Number(discount)) / 100;
      setAveragePrice(Number(price) - discountValue);
    }
  }, [discount, price]);

  // extracted to keep your submit flow readable
  const finalizeRequest = async () => {
    const request = await handleRequestSubmit(
      {
        status: "FINALIZED",
        averagePrice,
        updatePrice,
        discount: discount,
        priceWithOutDiscount: price,
        oldStatus: lead.status,
        isAdmin: user.role === "ADMIN",
        priceNote,
      },
      setLoading,
      `shared/client-leads/${id}/status`,
      false,
      "Finalizing the lead",
      false,
      "PUT"
    );

    if (request.status === 200) {
      if (setLead) {
        setLead((oldLead) => ({
          ...oldLead,
          status: "FINALIZED",
          averagePrice,
          priceWithOutDiscount: price,
          discount,
        }));
      }
      if (setleads) {
        setleads((prev) =>
          prev.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: "FINALIZED",
                  averagePrice: Number(averagePrice),
                  priceNote,
                }
              : l
          )
        );
      }
      if (onUpdate) onUpdate();
      if (setAnchorEl) setAnchorEl(null);
      if (setId) setId(null);
      setOpen(false);
    }
  };

  // the only change in behavior: we always show a dialog before proceeding
  async function submit() {
    if (!price || Number(price) <= 0) {
      setAlertError("Please enter a valid price agreed upon by the client.");
      return;
    }

    const hasAnyContracts =
      Array.isArray(lead.contracts) && lead.contracts.length > 0;
    const hasCurrent =
      hasAnyContracts &&
      lead.contracts.some(
        (c) => (c?.status || "").toUpperCase() === "IN_PROGRESS"
      );

    // choose which number to compare with the contract
    const finalPriceNumber =
      averagePrice != null && averagePrice !== ""
        ? Number(averagePrice)
        : Number(price);

    // try typical names; if undefined we still show a generic confirm
    const contractAmountRaw =
      currentContract &&
      (currentContract.amount ??
        currentContract.total ??
        currentContract.price);
    const contractAmount =
      contractAmountRaw != null && contractAmountRaw !== ""
        ? Number(contractAmountRaw)
        : null;

    let title = "Confirm";
    let message = "Are you sure you want to continue?";
    let severity = "info";

    // build the action that will run AFTER user confirms
    let run = async () => {
      // keep your original flow: if no contracts -> try to create one first
      if (!hasCurrent) {
        const pass = await handleSaveContract();
        if (!pass) return; // user still needs to fill required fields in your mini contract form
      }
      await finalizeRequest();
    };

    // decision logic (dialogs only — request runs after confirmation)
    if (!hasCurrent) {
      title = "No Current Contract";
      message =
        "There is no current in-progress contract for this lead. Do you want to proceed?";
      severity = "error";
    } else if (contractAmount != null) {
      if (
        Number.isFinite(finalPriceNumber) &&
        contractAmount === finalPriceNumber
      ) {
        title = "Amounts Match";
        message = `Contract amount (${contractAmount}) matches the final price (${finalPriceNumber}). Proceed?`;
        severity = "info";
      } else {
        title = "Amounts Do Not Match";
        message = `Warning: Contract amount (${contractAmount}) does not match the final price (${finalPriceNumber}). Do you still want to continue?`;
        severity = "warning";
      }
    } else {
      // we have a current contract but no readable amount
      title = "Proceed with Current Contract";
      message =
        "A current contract exists. Continue to finalize with the entered price?";
      severity = "info";
    }

    setConfirmMeta({ title, message, severity, run });
    setConfirmOpen(true);
  }

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullWidth
      maxWidth="lg"
      aria-labelledby="finalize-dialog-title"
    >
      <DialogTitle id="finalize-dialog-title">Finalize Lead Price</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {updatePrice
            ? "Please enter the new price (or average) that the client has agreed."
            : "Please enter the final price (or average) that the client has agreed upon to complete this lead."}
        </Typography>

        <TextField
          value={price}
          type="number"
          fullWidth
          label="Final Price without the discount"
          placeholder="Enter the agreed price"
          onChange={(e) => setPrice(e.target.value)}
          error={!price || Number(price) <= 0}
          helperText={
            !price || Number(price) <= 0
              ? "This field is required and must be a positive number."
              : ""
          }
          sx={{ mb: 2 }}
        />

        <TextField
          value={discount}
          type="number"
          fullWidth
          label="Discount (Percentage)"
          placeholder="Enter the discount"
          error={Number(discount) > 100 || Number(discount) < 0}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > 100 || v < 0) {
              setAlertError("Discount must be less than 100 or more than 0");
              return;
            }
            setDiscount(v);
          }}
          sx={{ mb: 2 }}
        />

        <TextField
          value={priceNote}
          type="text"
          multiline
          rows={2}
          fullWidth
          label="Price note"
          placeholder="Enter any notes you want to add"
          onChange={(e) => setPriceNote(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Alert severity="info" sx={{ mb: 2 }}>
          The current price is : {Number(averagePrice || 0)}
        </Alert>

        {/* keeps your existing contract section exactly the same */}
        <LeadContract lead={lead} updateOuterContract={updateOuterContract} />
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={submit} variant="contained">
          {updatePrice ? "Update" : "Submit"} Final Price
        </Button>
      </DialogActions>

      {/* Small confirmation dialog used by the validation layer */}
      <ConfirmDialog
        open={confirmOpen}
        severity={confirmMeta.severity}
        title={confirmMeta.title}
        message={confirmMeta.message}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          if (typeof confirmMeta.run === "function") {
            await confirmMeta.run();
          }
        }}
      />
    </Dialog>
  );
}

function LeadContract({ lead, updateOuterContract }) {
  const currentContract = lead?.contracts?.find((contract) => {
    return (contract.status || "").toUpperCase() === "IN_PROGRESS";
  });

  return (
    <>
      {!currentContract && <LeadContractList leadId={lead.id} />}
      {currentContract && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" sx={{ mb: 1.5 }}>
            Current in progress contract
          </Typography>
          <ViewContract
            id={currentContract.id}
            hide={{ basics: true, drawings: true, specialItems: true }}
            updateOuterContract={updateOuterContract}
          />
        </Box>
      )}
    </>
  );
}

/** Reusable, tiny confirmation dialog (MUI only) */
function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  severity = "info",
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="confirm-title"
    >
      <DialogTitle id="confirm-title">{title || "Confirm"}</DialogTitle>
      <DialogContent dividers>
        <Alert severity={severity} sx={{ mb: 2 }}>
          {message || "Are you sure?"}
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm}>
          Yes, Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
