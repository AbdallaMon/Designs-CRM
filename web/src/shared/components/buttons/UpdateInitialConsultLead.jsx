"use client";
import React from "react";
import ConfirmWithActionModel from "@/shared/components/models/ConfirmsWithActionModel.jsx";
import { useAuth } from "@/app/providers/AuthProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";

/**
 * "Move to New Leads" — flips a lead's `initialConsult` flag so it enters the New Leads
 * pool. Admin / super-sales only, and only while the lead is still un-consulted.
 *
 * Uses the shared branded confirm dialog (ConfirmWithActionModel) so it matches the rest
 * of the dashboard instead of a bespoke glassmorphism dialog.
 *
 * The payload MUST follow the v2 single-field-update contract `{ field, [field]: value }`
 * — the backend's `V.fieldUpdate` schema requires `field` and the usecase forwards only the
 * value keyed by it. Sending just `{ initialConsult: true }` (the old legacy shape) is
 * rejected with 422.
 */
function UpdateInitialConsultButton({ clientLead, fullWidth, onSuccess }) {
  const { user } = useAuth();
  const { setLoading } = useToastContext();

  if (user.role !== "ADMIN" && user.profile !== "SUPER_SALES") return null;
  if (clientLead.initialConsult !== false) return null;

  async function handleConfirm() {
    const response = await handleRequestSubmit(
      { field: "initialConsult", initialConsult: true },
      setLoading,
      `admin/leads/update/${clientLead.id}`,
      false,
      "Updating"
    );
    if (response.status === 200) {
      // Prefer a live, in-place update when the caller wires one; only fall back to a
      // hard reload when no callback is supplied (keeps standalone usages working).
      if (onSuccess) {
        onSuccess(response.data, clientLead);
      } else {
        window.location.reload();
      }
    }
    return response;
  }

  return (
    <ConfirmWithActionModel
      title="Move this lead to New Leads?"
      description="This marks the initial consultation as done and moves the lead into the New Leads pool so it can be assigned and processed."
      label="Move to New Leads"
      color="primary"
      size="small"
      fullWidth={fullWidth}
      handleConfirm={handleConfirm}
    />
  );
}

export default UpdateInitialConsultButton;
