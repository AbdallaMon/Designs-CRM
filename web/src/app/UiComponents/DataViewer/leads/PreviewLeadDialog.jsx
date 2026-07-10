"use client";
import React, { useState } from "react";
import {
  KanbanBeginerLeadsStatus,
  KanbanLeadsStatus,
} from "@/app/helpers/constants.js";
import {
  checkIfPrimaryStaff,
  enumToKeyValueArray,
} from "@/app/helpers/functions/utility.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { FinalizeModal } from "@/app/UiComponents/DataViewer/leads/widgets/FinalizeModal.jsx";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { usePermission } from "@/app/hooks/usePermission";
import { LEAD_CODES } from "@/app/helpers/permissionCodes";
import { PreviewLead } from "@/app/UiComponents/DataViewer/leads/features/PreviewLead.jsx";
import { MoreActionsMenu } from "@/app/UiComponents/DataViewer/leads/shared/MoreActionsMenu.jsx";
import { LeadDialogHeader } from "@/app/UiComponents/DataViewer/leads/shared/LeadDialogHeader.jsx";
import { StatusMenu } from "@/app/UiComponents/DataViewer/leads/shared/StatusMenu.jsx";
import { LeadWorkspace } from "@/app/UiComponents/DataViewer/leads/LeadWorkspace.jsx";
import { getVisibleLeadSections } from "@/app/UiComponents/DataViewer/leads/config/leadSections.jsx";
import { useLeadDetails } from "@/app/UiComponents/DataViewer/leads/context/LeadDetailsContext.jsx";

// LeadContent — the shared body of the lead/deal detail. The header + modals + status
// menu stay here; the section list itself is now driven by the config registry
// (config/leadSections.jsx) and rendered by the keyed workspace (no fragile tab indices).
const LeadContent = ({
  lead,
  activeTab,
  setActiveTab,
  theme,
  handleClose,
  setleads,
  setLead,
  isPage,
  setRerenderColumns,
}) => {
  const { user } = useAuth();
  const isPrimaryStaff = checkIfPrimaryStaff(user);
  const perms = usePermission();
  // admin-tier lead operator = holds lead.assign.other (== checkIfAdminOrSuperSales); honors subRoles per the profiles model
  const admin = perms.hasPermission(LEAD_CODES.ASSIGN_OTHER);
  const details = useLeadDetails();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { setLoading } = useToastContext();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPriceModel, setOpenPriceModel] = useState(null);
  const [finalizeModel, setFinalizeModel] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [payments, setPayments] = useState(lead ? lead.payments : []);
  const [paymentModal, setPaymentModal] = useState(false);

  async function createADeal(lead) {
    const assign = await handleRequestSubmit(
      lead,
      setLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT",
    );
    // Re-pull the core lead so ownership/header reflect the assignment in place —
    // no full-page reload (which would drop tab caches + scroll position).
    if (assign.status === 200) {
      await details?.refetchCore?.();
      details?.refreshKanban?.();
    }
    return assign;
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = async (value) => {
    if (value === "FINALIZED") {
      setCurrentId(lead.id);
      setFinalizeModel(true);
      return;
    }
    const request = await handleRequestSubmit(
      { status: value, oldStatus: lead.status },
      setLoading,
      `shared/client-leads/${lead.id}/actions/change-status`,
      false,
      "Updating",
      null,
      "POST",
    );
    if (request.status === 200) {
      if (setRerenderColumns) {
        setRerenderColumns((prev) => ({
          ...prev,
          [value]: !prev[value],
          [lead.status]: !prev[lead.status],
        }));
      }
      if (setLead) {
        setLead((oldLead) => ({ ...oldLead, status: value }));
      }
      setAnchorEl(null);
    }
  };

  const handleConvertLead = async () => {
    if (admin) return;
    const request = await handleRequestSubmit(
      { status: "ON_HOLD" },
      setLoading,
      `shared/client-leads/${lead.id}/actions/change-status`,
      false,
      "Converting",
      false,
      "POST",
    );
    // The owner just handed the lead back. Reflect ON_HOLD locally so the access
    // guard in PreviewLead takes over (shows the "no access" screen) and bump the
    // board — no full-page reload.
    if (request.status === 200) {
      if (setLead) setLead((old) => ({ ...old, status: "ON_HOLD" }));
      details?.refreshKanban?.("ON_HOLD");
    }
  };

  if (!lead) return;

  const leadStatus = enumToKeyValueArray(
    user.role === "STAFF" && !user.isPrimary
      ? KanbanBeginerLeadsStatus
      : KanbanLeadsStatus,
  );

  const notUser = isPage && user.id !== lead.userId && !admin;
  const leadCtx = {
    lead,
    user,
    admin,
    isPrimaryStaff,
    notUser,
    perms,
    setLead,
    setleads,
    payments,
    setPayments,
  };
  const visibleSections = getVisibleLeadSections(leadCtx);

  return (
    <>
      {/* Modals */}
      {isPage && user.id !== lead.userId && !admin ? null : (
        <>
          <FinalizeModal
            lead={lead}
            open={finalizeModel}
            setOpen={setFinalizeModel}
            id={currentId}
            setId={setCurrentId}
            setLead={setLead}
            setAnchorEl={setAnchorEl}
            onUpdate={() => {
              if (setRerenderColumns) {
                setRerenderColumns((prev) => ({
                  ...prev,
                  [lead.status]: !prev[lead.status],
                  FINALIZED: !prev.FINALIZED,
                }));
              }
            }}
          />
          <FinalizeModal
            lead={lead}
            open={openPriceModel}
            setOpen={setOpenPriceModel}
            id={lead.id}
            setleads={setleads}
            setLead={setLead}
            updatePrice={true}
          />
        </>
      )}

      {/* Header */}
      <LeadDialogHeader
        lead={lead}
        theme={theme}
        handleClose={handleClose}
        isPage={isPage}
        admin={admin}
        user={user}
        handleClick={handleClick}
        setLead={setLead}
        createADeal={createADeal}
        MoreActionsComponent={
          <MoreActionsMenu
            lead={lead}
            admin={admin}
            user={user}
            isPage={isPage}
            setleads={setleads}
            setLead={setLead}
            payments={payments}
            setPayments={setPayments}
            paymentModal={paymentModal}
            setPaymentModal={setPaymentModal}
            openConfirm={openConfirm}
            setOpenConfirm={setOpenConfirm}
            createADeal={createADeal}
            handleConvertLead={handleConvertLead}
          />
        }
      />

      {/* Status Menu — kept in lockstep with the header's status control: gated on the
          backend `canChangeStatus` capability when present (parity-safe), else shown. */}
      {lead.status !== "NEW" &&
        (lead.capabilities ? lead.capabilities.canChangeStatus : true) && (
          <StatusMenu
            open={open}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            statuses={leadStatus}
            onStatusChange={handleMenuClose}
            theme={theme}
          />
        )}

      {/* Workspace — config-driven sections, keyed (no index math) */}
      <LeadWorkspace
        sections={visibleSections}
        activeKey={activeTab}
        onChange={setActiveTab}
        ctx={leadCtx}
      />
    </>
  );
};

const PreviewDialog = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  setRerenderColumns,
}) => {
  return (
    <PreviewLead
      leadContent={LeadContent}
      id={id}
      open={open}
      onClose={onClose}
      setleads={setleads}
      setRerenderColumns={setRerenderColumns}
      page={page}
      url={`shared/client-leads/${id}`}
    />
  );
};

export default PreviewDialog;
