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
  KanbanLeadsStatus,
  LeadCategory,
  simpleModalStyle,
  statusColors,
} from "@/app/helpers/constants.js";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import { getData } from "@/app/helpers/functions/getData.js";
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
} from "./LeadTabs";
import {
  MdBlock,
  MdMeetingRoom,
  MdModeEdit,
  MdSchedule,
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
import { EditFieldButton } from "./extra/EditFieldButton";
import { AssignNewStaffModal } from "../utility/AssignNewStaffModal";
import UpdatesList from "./leadUpdates/UpdatesList";
import ClientImageSessionManager from "../image-session/ClientSessionImageManager";

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
      if (setleads) {
        setleads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: value } : l))
        );
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

  const leadStatus = enumToKeyValueArray(KanbanLeadsStatus);
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
            setleads={setleads}
            setLead={setLead}
            setAnchorEl={setAnchorEl}
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
          pb: 2,
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            {handleClose && (
              <IconButton onClick={() => handleClose(isPage)} sx={{ mr: 1 }}>
                <BsArrowLeft size={20} />
              </IconButton>
            )}
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {lead.client.name[0]}
            </Avatar>
            {(lead.status === "NEW" || lead.status === "ON_HOLD") && !admin ? (
              ""
            ) : (
              <Typography variant="h6">
                #{lead.id.toString().padStart(7, "0")} {lead.client.name}
              </Typography>
            )}
            {(user.role === "ADMIN" ||
              user.role === "SUPER_ADMIN" ||
              user.role === "STAFF") && (
              <Badge color="primary" badgeContent={lead.paymentStatus}>
                Initial payment
              </Badge>
            )}
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <TelegramLink lead={lead} setLead={setLead} />
            <UpdateInitialConsultButton clientLead={lead} />
            {(lead.status === "FINALIZED" || lead.status === "ARCHIVED") && (
              <ClientImageSessionManager clientLeadId={lead.id} />
            )}
            {admin && (
              <EditFieldButton
                text={"Client name"}
                path={`admin/client/update/${lead.client.id}`}
                reqType="PUT"
                field="name"
                onUpdate={(data) => {
                  if (setLead) {
                    setLead((oldLead) => ({
                      ...oldLead,
                      client: { ...oldLead.client, name: data.name },
                    }));
                  }
                  if (setleads) {
                    setleads((oldLeads) =>
                      oldLeads.map((l) => {
                        if (l.id === lead.id) {
                          return {
                            ...lead,
                            client: {
                              ...lead.client,
                              name: data.name,
                            },
                          };
                        } else {
                          return l;
                        }
                      })
                    );
                  }
                }}
              />
            )}
          </Stack>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            alignItems={{ sm: "center" }}
            justifyContent="flex-end"
          >
            {isPage &&
            user.id !== lead.userId &&
            !admin &&
            user.role !== "ACCOUNTANT" ? (
              <ConfirmWithActionModel
                title={
                  "Are you sure you want to get this lead and assign it to you as a new deal?"
                }
                handleConfirm={() => createADeal(lead)}
                label={"Start a deal"}
                fullWidth={false}
                size="small"
              />
            ) : (
              <>
                {lead.status === "FINALIZED" && (
                  <>
                    <Button
                      fullWidth={isMobile}
                      variant="outlined"
                      startIcon={!admin && <AiOutlineSwap />}
                      aria-controls={openPriceModel ? "basic-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={openPriceModel ? "true" : undefined}
                      // onClick={() => setOpenPriceModel(true)}
                      sx={{
                        fontWeight: 500,
                        borderRadius: "50px",
                      }}
                    >
                      Final price : {lead.averagePrice}
                    </Button>
                    {payments?.length > 0 ? (
                      <PaymentDialog payments={payments} />
                    ) : (
                      <>
                        {(user.role === "STAFF" ||
                          user.role === "SUPER_ADMIN" ||
                          user.role === "ADMIN") && (
                          <AddPayments
                            lead={lead}
                            open={paymentModal}
                            paymentType={"final-price"}
                            setOpen={setPaymentModal}
                            totalAmount={lead.averagePrice}
                            setOldPayments={setPayments}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                {!admin &&
                  user.role == "STAFF" &&
                  lead.status !== "FINALIZED" && (
                    <>
                      <Button
                        fullWidth={isMobile}
                        variant="outlined"
                        startIcon={<BsPersonCheck size={18} />}
                        onClick={() => setOpenConfirm(true)}
                        sx={{
                          borderRadius: "50px",
                          textTransform: "none",
                        }}
                      >
                        Convert lead
                      </Button>
                      <Modal
                        open={openConfirm}
                        onClose={() => setOpenConfirm(false)}
                        closeAfterTransition
                      >
                        <Fade in={openConfirm}>
                          <Box sx={{ ...simpleModalStyle }}>
                            <Typography variant="h6" component="h2" mb={2}>
                              Convert lead so some one else take it?
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginTop: "16px",
                              }}
                            >
                              <Button
                                variant="contained"
                                color={"primary"}
                                onClick={handleConvertLead}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="contained"
                                onClick={() => setOpenConfirm(false)}
                                sx={{ marginLeft: "8px", color: "text.white" }}
                                color="secondary"
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        </Fade>
                      </Modal>
                    </>
                  )}
                {user.role !== "ACCOUNTANT" && (
                  <>
                    {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                      <>
                        <DeleteModal
                          item={lead}
                          href={"admin/client-leads"}
                          handleClose={() => {
                            window.location.reload();
                          }}
                        />
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
                      </>
                    )}
                    <Button
                      fullWidth={isMobile}
                      variant="contained"
                      startIcon={!admin && <AiOutlineSwap />}
                      aria-controls={open ? "basic-menu" : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? "true" : undefined}
                      onClick={handleClick}
                      sx={{
                        background: statusColors[lead.status],
                        fontWeight: 500,
                        borderRadius: "50px",
                      }}
                    >
                      {ClientLeadStatus[lead.status]}
                    </Button>
                    <Menu
                      id="basic-menu"
                      anchorEl={anchorEl}
                      open={open}
                      onClose={() => setAnchorEl(null)}
                      MenuListProps={{
                        "aria-labelledby": "basic-button",
                      }}
                    >
                      {leadStatus.map((lead) => (
                        <MenuItem
                          key={lead.id}
                          value={lead.id}
                          onClick={() => handleMenuClose(lead.id)}
                        >
                          {lead.name}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}
              </>
            )}

            <Button onClick={() => generatePDF(lead, user)}>
              Generate pdf
            </Button>
          </Stack>
        </Stack>
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
          icon={<BsTelephone size={20} />}
          label="Calls"
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
        <Tab
          icon={<PiCurrencyDollarSimpleLight size={20} />}
          label="Price Offers"
          sx={{ textTransform: "none" }}
        />
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
          <LeadData lead={lead} admin={admin} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <CallReminders
            admin={admin}
            lead={lead}
            setleads={setleads}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <MeetingReminders
            admin={admin}
            lead={lead}
            setleads={setleads}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <LeadNotes
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <PriceOffersList
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={5}>
          <FileList
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>

        {payments?.length > 0 && (
          <TabPanel value={activeTab} index={6}>
            <ExtraServicesList
              admin={admin}
              lead={lead}
              notUser={isPage && user.id !== lead.userId}
              setPayments={setPayments}
            />
          </TabPanel>
        )}
        <TabPanel value={activeTab} index={payments?.length > 0 ? 7 : 6}>
          <LeadProjects clientLeadId={lead.id} />
        </TabPanel>
        <TabPanel value={activeTab} index={payments?.length > 0 ? 8 : 7}>
          <TasksList
            name="Modifcation"
            type="MODIFICATION"
            clientLeadId={lead.id}
          />
        </TabPanel>
        {lead.status === "FINALIZED" && (
          <TabPanel value={activeTab} index={payments?.length > 0 ? 9 : 8}>
            <UpdatesList clientLeadId={lead.id} />
          </TabPanel>
        )}
      </Box>
    </>
  );
};

function LeadData({ lead }) {
  return (
    <Stack spacing={3}>
      <LeadInfo lead={lead} />
      <LeadContactInfo lead={lead} />
    </Stack>
  );
}

const PreviewDialog = ({ open, onClose, id, setleads, page = false }) => {
  return (
    <PreviewLead
      leadContent={LeadContent}
      id={id}
      open={open}
      onClose={onClose}
      setleads={setleads}
      page={page}
      url={`shared/client-leads/${id}`}
    />
  );
};

export default PreviewDialog;
