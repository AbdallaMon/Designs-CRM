"use client";
import React, { useEffect, useState } from "react";
import { Alert, Box, Stack, Tab, Tabs } from "@mui/material";
import { BsFileText, BsInfoCircle, BsTelephone } from "react-icons/bs";
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
import { GoPaperclip } from "react-icons/go";
import { PiCurrencyDollarSimpleLight } from "react-icons/pi";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { FaServicestack } from "react-icons/fa";
import { SalesToolsTabs } from "./tabs/SalesToolsTabs";
import {
  MdAnalytics,
  MdBlock,
  MdModeEdit,
  MdSchedule,
  MdTimeline,
  MdUpdate,
  MdWork,
} from "react-icons/md";
import LeadProjects from "../work-stages/projects/LeadProjects";
import { TasksList } from "../tasks/TasksList";
import { LeadContactInfo } from "./panels/LeadContactInfo";
import { LeadInfo } from "./panels/LeadInfo";
import { PreviewLead } from "./features/PreviewLead";
import UpdatesList from "./leadUpdates/UpdatesList";
import SalesStageComponent from "./tabs/SalesStage";
import LeadStripeInfo from "./panels/StipieData";
import { CallReminders } from "./tabs/CallReminders";
import { MeetingReminders } from "./tabs/MeetingReminders";
import { FileList } from "./tabs/Files";
import { LeadNotes } from "./tabs/LeadsNotes";
import { PriceOffersList } from "./tabs/PriceOffers";
import { ExtraServicesList } from "./tabs/ExtraTabs";
import { TabPanel } from "./shared/TabPanel";
import { MoreActionsMenu } from "./shared/MoreActionsMenu";
import { LeadDialogHeader } from "./shared/LeadDialogHeader";
import { StatusMenu } from "./shared/StatusMenu";

// LeadContent Component (Extracted Shared Content)
const LeadContent = ({
  lead,
  activeTab,
  setActiveTab,
  theme,
  isMobile,
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
  const [isAllowed, setIsAllowed] = useState(true);
  const [isAllowedLoading, setIsAllowedLoading] = useState(false);
  const [finalizeModel, setFinalizeModel] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [payments, setPayments] = useState(lead ? lead.payments : []);
  const [paymentModal, setPaymentModal] = useState(false);
  const isNotPrimaryUser = !isPrimaryStaff;
  async function createADeal(lead) {
    const assign = await handleRequestSubmit(
      lead,
      setLoading,
      `shared/client-leads`,
      false,
      "Assigning",
      false,
      "PUT"
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
      `shared/client-leads/${lead.id}/status`,
      false,
      "Updating",
      null,
      "PUT"
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
      `shared/client-leads/${lead.id}/status`,
      false,
      "Converting",
      false,
      "PUT"
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
      : KanbanLeadsStatus
  );

  if (isAllowedLoading) return <FullScreenLoader />;

  if (!isAllowed && user.id !== lead.userId && user.role === "STAFF") {
    return (
      <Alert severity="error" icon={<MdBlock size={20} />}>
        Access to this lead is <b>Not Allowed</b>.
      </Alert>
    );
  }

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

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{
          px: { xs: 0.5, md: 3 },
          borderBottom: 1,
          borderColor: "divider",
          minHeight: "fit-content",
          "& .MuiTab-root": {
            fontSize: { xs: "0.75rem", md: "0.875rem" }, // Smaller font size on mobile
          },
        }}
        variant={"scrollable"}
        scrollButtons="auto"
      >
        <Tab
          icon={<BsInfoCircle size={20} />}
          label="Details"
          sx={{ textTransform: "none" }}
        />
        <Tab
          icon={<MdTimeline size={20} />}
          label="Sales stage"
          sx={{ textTransform: "none" }}
        />
        <Tab
          icon={<BsTelephone size={20} />}
          label="Calls"
          sx={{ textTransform: "none" }}
        />
        <Tab
          icon={<MdAnalytics size={20} />}
          label="Client analysis"
          sx={{ textTransform: "none" }}
        />
        <Tab
          icon={<MdSchedule size={20} />}
          label="Meetings"
          sx={{ textTransform: "none" }}
        />
        <Tab
          icon={<BsFileText size={20} />}
          label="Notes"
          sx={{ textTransform: "none" }}
        />
        {isNotPrimaryUser && !admin ? null : (
          <Tab
            icon={<PiCurrencyDollarSimpleLight size={20} />}
            label="Price Offers"
            sx={{ textTransform: "none" }}
          />
        )}
        <Tab
          icon={<GoPaperclip size={20} />}
          label="Attatchments"
          sx={{ textTransform: "none" }}
        />

        {payments?.length > 0 && (
          <Tab
            icon={<FaServicestack size={20} />}
            label="Another services"
            sx={{ textTransform: "none" }}
          />
        )}
        {(user.role === "ADMIN" ||
          user.role === "SUPER_ADMIN" ||
          user.role === "STAFF") && (
          <Tab
            icon={<MdWork size={20} />}
            label="Projects"
            sx={{ textTransform: "none" }}
          />
        )}
        {(admin || isPrimaryStaff) && (
          <Tab
            icon={<MdModeEdit size={20} />}
            label="Modificaions"
            sx={{ textTransform: "none" }}
          />
        )}
        {lead.status === "FINALIZED" && (
          <Tab
            icon={<MdUpdate size={20} />}
            label="Updates"
            sx={{ textTransform: "none" }}
          />
        )}
      </Tabs>

      <Box
        sx={{
          p: { xs: 2, md: 3 },
          overflowY: "auto",
          maxHeight: { md: "600px" },
        }}
      >
        <TabPanel value={activeTab} index={0}>
          <LeadData
            lead={lead}
            admin={admin}
            setLead={setLead}
            setleads={setleads}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <SalesStageComponent clientLeadId={lead.id} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <CallReminders
            admin={admin}
            lead={lead}
            setleads={setleads}
            notUser={isPage && user.id !== lead.userId && !admin}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <SalesToolsTabs lead={lead} setleads={setleads} setLead={setLead} />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <MeetingReminders
            admin={admin}
            lead={lead}
            setleads={setleads}
            notUser={isPage && user.id !== lead.userId && !admin}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={5}>
          <LeadNotes
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId && !admin}
          />
        </TabPanel>
        {isNotPrimaryUser && !admin ? null : (
          <TabPanel value={activeTab} index={6}>
            <PriceOffersList
              admin={admin}
              lead={lead}
              notUser={isPage && user.id !== lead.userId && !admin}
            />
          </TabPanel>
        )}
        <TabPanel value={activeTab} index={isNotPrimaryUser && !admin ? 6 : 7}>
          <FileList
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId && !admin}
          />
        </TabPanel>

        {payments?.length > 0 && (
          <TabPanel
            value={activeTab}
            index={isNotPrimaryUser && !admin ? 7 : 8}
          >
            <ExtraServicesList
              admin={admin}
              lead={lead}
              notUser={isPage && user.id !== lead.userId && !admin}
              setPayments={setPayments}
            />
          </TabPanel>
        )}
        {isNotPrimaryUser && !admin ? null : (
          <>
            <TabPanel value={activeTab} index={payments?.length > 0 ? 9 : 8}>
              <LeadProjects clientLeadId={lead.id} />
            </TabPanel>
            <TabPanel value={activeTab} index={payments?.length > 0 ? 10 : 9}>
              <TasksList
                name="Modifcation"
                type="MODIFICATION"
                clientLeadId={lead.id}
              />
            </TabPanel>
            {lead.status === "FINALIZED" && (
              <TabPanel
                value={activeTab}
                index={payments?.length > 0 ? 11 : 10}
              >
                <UpdatesList clientLeadId={lead.id} />
              </TabPanel>
            )}
          </>
        )}
      </Box>
    </>
  );
};

function LeadData({ lead, setLead, setleads }) {
  return (
    <Stack spacing={3}>
      <LeadInfo lead={lead} setLead={setLead} setleads={setleads} />
      <LeadContactInfo lead={lead} setLead={setLead} setleads={setleads} />
      <LeadStripeInfo lead={lead} />
    </Stack>
  );
}

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
