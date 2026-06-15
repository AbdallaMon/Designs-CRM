"use client";
import React, { useEffect, useState } from "react";
import { Alert } from "@mui/material";
import {
  KanbanBeginerLeadsStatus,
  KanbanLeadsStatus,
} from "@/app/helpers/constants.js";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import {
  checkIfAdminOrSuperSales,
  checkIfPrimaryStaff,
  enumToKeyValueArray,
} from "@/app/helpers/functions/utility.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { FinalizeModal } from "@/app/UiComponents/DataViewer/leads/widgets/FinalizeModal.jsx";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { MdBlock } from "react-icons/md";
import { PreviewLead } from "./features/PreviewLead";
import { MoreActionsMenu } from "./shared/MoreActionsMenu";
import { LeadDialogHeader } from "./shared/LeadDialogHeader";
import { StatusMenu } from "./shared/StatusMenu";
import { LeadWorkspace } from "./LeadWorkspace";
import { getVisibleLeadSections } from "./config/leadSections";

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
  const admin = checkIfAdminOrSuperSales(user);
  const isPrimaryStaff = checkIfPrimaryStaff(user);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { setLoading } = useToastContext();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPriceModel, setOpenPriceModel] = useState(null);
  const [isAllowed] = useState(true);
  const [isAllowedLoading, setIsAllowedLoading] = useState(false);
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
    if (assign.status === 200) {
      window.location.reload();
    }
    return assign;
  }

  useEffect(() => {
    if (lead) {
      if (user.id !== lead.userId && user.role === "STAFF") {
        // Permission check logic here
      } else {
        setIsAllowedLoading(false);
      }
    }
  }, [user.id, lead, lead?.country]);

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
      { status: value, oldStatus: lead.status, isAdmin: admin },
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
    if (request.status === 200) {
      window.setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  };

  if (!lead) return;

  const leadStatus = enumToKeyValueArray(
    user.role === "STAFF" && !user.isPrimary
      ? KanbanBeginerLeadsStatus
      : KanbanLeadsStatus,
  );

  if (isAllowedLoading) return <FullScreenLoader />;

  if (!isAllowed && user.id !== lead.userId && user.role === "STAFF") {
    return (
      <Alert severity="error" icon={<MdBlock size={20} />}>
        Access to this lead is <b>Not Allowed</b>.
      </Alert>
    );
  }

  const notUser = isPage && user.id !== lead.userId && !admin;
  const leadCtx = {
    lead,
    user,
    admin,
    isPrimaryStaff,
    notUser,
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

      {/* Status Menu */}
      {lead.status !== "NEW" && (
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
