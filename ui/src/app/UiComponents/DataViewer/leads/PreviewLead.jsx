"use client";
import React, { useEffect, useState } from "react";
import {
  Alert,
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  Fade,
  Grid2 as Grid,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  BsArrowLeft,
  BsFileText,
  BsInfoCircle,
  BsPersonCheck,
  BsTelephone,
} from "react-icons/bs";
import {
  ClientLeadStatus,
  KanbanBeginerLeadsStatus,
  KanbanLeadsStatus,
  statusColors,
} from "@/app/helpers/constants.js";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import { AiOutlineSwap } from "react-icons/ai";
import {
  checkIfAdmin,
  enumToKeyValueArray,
} from "@/app/helpers/functions/utility.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { FinalizeModal } from "@/app/UiComponents/DataViewer/leads/FinalizeModal.jsx";
import { GoPaperclip } from "react-icons/go";
import { PiCurrencyDollarSimpleLight } from "react-icons/pi";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { generatePDF } from "@/app/UiComponents/buttons/GenerateLeadPdf.jsx";
import dayjs from "dayjs";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import AddPayments from "./AddPayments";
import PaymentDialog from "./PaymentsDialog";
import { FaServicestack } from "react-icons/fa";
import {
  LeadNotes,
  PriceOffersList,
  CallReminders,
  FileList,
  ExtraServicesList,
  MeetingReminders,
  SalesToolsTabs,
} from "./LeadTabs";
import {
  MdAnalytics,
  MdBlock,
  MdMeetingRoom,
  MdModeEdit,
  MdMoreHoriz,
  MdSchedule,
  MdTimeline,
  MdUpdate,
  MdWork,
} from "react-icons/md";
import LeadProjects from "../work-stages/projects/LeadProjects";
import { TasksList } from "../utility/TasksList";
import TelegramLink from "../work-stages/utility/TelegramLink";
import { LeadContactInfo } from "./extra/LeadContactInfo";
import { LeadInfo } from "./extra/LeadInfo";
import { PreviewLead } from "./extra/PreviewLead";
import UpdateInitialConsultButton from "../../buttons/UpdateInitialConsultLead";
import DeleteModal from "../../models/DeleteModal";
import { AssignNewStaffModal } from "../utility/AssignNewStaffModal";
import UpdatesList from "./leadUpdates/UpdatesList";
import ClientImageSessionManager from "../image-session/users/ClientSessionImageManager";
import SalesStageComponent from "./extra/SalesStage";

const TabPanel = ({ children, value, index }) => (
  <Box role="tabpanel" hidden={value !== index} sx={{ py: 2 }}>
    {value === index && children}
  </Box>
);

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
  const admin = checkIfAdmin(user);
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
  const isNotPrimaryUser = user.role === "STAFF" && !user.isPrimary;
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
      {isPage && user.id !== lead.userId ? (
        ""
      ) : (
        <>
          <FinalizeModal
            lead={lead}
            open={finalizeModel}
            setOpen={setFinalizeModel}
            id={currentId}
            setId={setCurrentId}
            // setleads={setleads}
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

      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          pb: 0,
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        }}
      >
        {/* Main Header Row */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ py: 2, px: 1 }}
        >
          {/* Left Section - Lead Info */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{ flex: 1 }}
          >
            {handleClose && (
              <IconButton
                onClick={() => handleClose(isPage)}
                sx={{
                  backgroundColor: "#f5f5f5",
                  "&:hover": { backgroundColor: "#e0e0e0" },
                  mr: 1,
                }}
              >
                <BsArrowLeft size={18} />
              </IconButton>
            )}

            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 48,
                height: 48,
                fontSize: "1.2rem",
                fontWeight: 600,
              }}
            >
              {lead.client.name[0]}
            </Avatar>

            <Box>
              {(lead.status === "NEW" || lead.status === "ON_HOLD") &&
              !admin ? (
                <Typography variant="h6" color="text.secondary">
                  Lead Preview
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="h5"
                    fontWeight={600}
                    color="text.primary"
                  >
                    {lead.client.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    #{lead.id.toString().padStart(7, "0")}
                  </Typography>
                </>
              )}
            </Box>
          </Stack>

          {/* Right Section - Status & Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            {(user.role === "ADMIN" ||
              user.role === "SUPER_ADMIN" ||
              user.role === "STAFF") && (
              <Chip
                label={`Payment: ${lead.paymentStatus}`}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 500 }}
              />
            )}

            {/* Status Button/Menu */}
            {user.role !== "ACCOUNTANT" && (
              <Button
                variant="contained"
                startIcon={<AiOutlineSwap size={16} />}
                onClick={handleClick}
                sx={{
                  background: statusColors[lead.status],
                  fontWeight: 500,
                  borderRadius: "20px",
                  px: 2,
                  py: 0.5,
                  fontSize: "0.875rem",
                  textTransform: "none",
                  minWidth: "120px",
                }}
              >
                {ClientLeadStatus[lead.status]}
              </Button>
            )}

            {/* More Actions Menu */}
            {lead.status === "NEW" && !admin ? (
              <Button
                onClick={() => {
                  createADeal(lead);
                }}
                variant="contained"
              >
                <MdWork size={16} style={{ marginRight: 12 }} />
                Start Deal
              </Button>
            ) : (
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
            )}
            {/* Status Menu */}
            {lead.status !== "NEW" && (
              <Menu
                id="status-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: 2,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                  },
                }}
              >
                {leadStatus.map((status) => (
                  <MenuItem
                    key={status.id}
                    onClick={() => handleMenuClose(status.id)}
                    sx={{
                      py: 1,
                      px: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor:
                          statusColors[status.id] || theme.palette.primary.main,
                        mr: 1.5,
                      }}
                    />
                    {status.name}
                  </MenuItem>
                ))}
              </Menu>
            )}
          </Stack>
        </Stack>

        {/* Secondary Actions Row */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor: "divider",
            backgroundColor: "#fafafa",
            px: 3,
            py: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": {
                height: 4,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#ccc",
                borderRadius: 2,
              },
            }}
          >
            {/* Primary Actions */}
            <TelegramLink lead={lead} setLead={setLead} />
            <UpdateInitialConsultButton clientLead={lead} />

            {(lead.status === "FINALIZED" ||
              lead.status === "ARCHIVED" ||
              lead.status === "REJECTED") && (
              <ClientImageSessionManager clientLeadId={lead.id} />
            )}

            {lead.status === "FINALIZED" && (
              <Chip
                label={`Final Price: ${lead.averagePrice}`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            )}

            <Button
              variant="outlined"
              size="small"
              startIcon={<BsFileText size={14} />}
              onClick={() => generatePDF(lead, user)}
              sx={{
                borderRadius: "16px",
                textTransform: "none",
                fontSize: "0.75rem",
                px: 2,
              }}
            >
              PDF
            </Button>
          </Stack>
        </Box>
      </DialogTitle>
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
        {isNotPrimaryUser ? null : (
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
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <Tab
            icon={<MdWork size={20} />}
            label="Projects"
            sx={{ textTransform: "none" }}
          />
        )}
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
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
        {isNotPrimaryUser ? null : (
          <TabPanel value={activeTab} index={6}>
            <PriceOffersList
              admin={admin}
              lead={lead}
              notUser={isPage && user.id !== lead.userId && !admin}
            />
          </TabPanel>
        )}
        <TabPanel value={activeTab} index={isNotPrimaryUser ? 6 : 7}>
          <FileList
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId && !admin}
          />
        </TabPanel>

        {payments?.length > 0 && (
          <TabPanel value={activeTab} index={isNotPrimaryUser ? 7 : 8}>
            <ExtraServicesList
              admin={admin}
              lead={lead}
              notUser={isPage && user.id !== lead.userId && !admin}
              setPayments={setPayments}
            />
          </TabPanel>
        )}
        {isNotPrimaryUser ? null : (
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
      <LeadInfo lead={lead} />
      <LeadContactInfo lead={lead} setLead={setLead} setleads={setleads} />
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
const MoreActionsMenu = ({
  lead,
  admin,
  user,
  isPage,
  setleads,
  setLead,
  payments,
  setPayments,
  paymentModal,
  setPaymentModal,
  openConfirm,
  setOpenConfirm,
  createADeal,
  handleConvertLead,
}) => {
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const moreOpen = Boolean(moreAnchorEl);

  const handleMoreClick = (event) => {
    setMoreAnchorEl(event.currentTarget);
  };

  const handleMoreClose = () => {
    setMoreAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleMoreClick}
        sx={{
          backgroundColor: "#f5f5f5",
          "&:hover": { backgroundColor: "#e0e0e0" },
          width: 40,
          height: 40,
        }}
      >
        <MdMoreHoriz size={18} />
      </IconButton>

      <Menu
        anchorEl={moreAnchorEl}
        open={moreOpen}
        onClose={handleMoreClose}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 200,
          },
        }}
      >
        {/* Convert Lead Option */}
        {!admin &&
          user.role === "STAFF" &&
          lead.status !== "FINALIZED" &&
          lead.status !== "NEW" && (
            <MenuItem
              onClick={() => {
                setOpenConfirm(true);
              }}
              sx={{ py: 1.5 }}
            >
              <BsPersonCheck size={16} style={{ marginRight: 12 }} />
              Convert Lead
            </MenuItem>
          )}

        {/* Assign Deal Option */}
        {isPage &&
          user.id !== lead.userId &&
          !admin &&
          user.role !== "ACCOUNTANT" && (
            <MenuItem
              onClick={() => {
                createADeal(lead);
              }}
              sx={{ py: 1.5 }}
            >
              <MdWork size={16} style={{ marginRight: 12 }} />
              Start Deal
            </MenuItem>
          )}

        {/* Admin Actions */}
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <>
            <MenuItem>
              <DeleteModal
                item={lead}
                href={"admin/client-leads"}
                fullButtonWidth={true}
                handleClose={() => {
                  window.location.reload();
                }}
              />
            </MenuItem>
            <MenuItem>
              <AssignNewStaffModal
                lead={lead}
                onUpdate={(newLead) => {
                  if (setLead) {
                    setLead((oldLead) => ({
                      ...oldLead,
                      assignedTo: { ...newLead.assignedTo },
                      status: newLead.status,
                    }));
                  }
                  if (setleads) {
                    setleads((oldLeads) =>
                      oldLeads.map((l) => {
                        if (l.id === lead.id) {
                          return {
                            ...lead,
                            assignedTo: { ...newLead.assignedTo },
                            status: newLead.status,
                          };
                        } else {
                          return l;
                        }
                      })
                    );
                  }
                }}
              />
            </MenuItem>
          </>
        )}

        {(lead.status === "FINALIZED" || lead.status === "ARCHIVED") && (
          <>
            {(user.role === "STAFF" ||
              user.role === "SUPER_ADMIN" ||
              user.role === "ADMIN") && (
              <MenuItem>
                <AddPayments
                  fullButtonWidth={true}
                  lead={lead}
                  open={paymentModal}
                  paymentType={"final-price"}
                  setOpen={setPaymentModal}
                  totalAmount={lead.averagePrice}
                  setOldPayments={setPayments}
                />
              </MenuItem>
            )}
            {/* Payment Actions */}
            <>
              {payments?.length > 0 && (
                <MenuItem sx={{ py: 1.5 }}>
                  <PaymentDialog payments={payments} />
                </MenuItem>
              )}
            </>
          </>
        )}
      </Menu>

      {/* Convert Lead Modal */}
      <Modal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        closeAfterTransition
      >
        <Fade in={openConfirm}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "white",
              borderRadius: 3,
              boxShadow: 24,
              p: 3,
            }}
          >
            <Typography variant="h6" component="h2" mb={2}>
              Convert Lead
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Convert this lead so someone else can take it?
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={() => setOpenConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleConvertLead}
                color="primary"
              >
                Confirm
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};
export default PreviewDialog;
