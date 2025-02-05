"use client";
import React, { useEffect, useState } from "react";
import {
  Alert,
  alpha,
  Avatar,
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
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  BsArrowLeft,
  BsBuilding,
  BsFileText,
  BsInfoCircle,
  BsPerson,
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
import { enumToKeyValueArray } from "@/app/helpers/functions/utility.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { FinalizeModal } from "@/app/UiComponents/DataViewer/leads/FinalizeModal.jsx";
import PriceOffersList from "@/app/UiComponents/DataViewer/leads/PriceOffersList.jsx";
import CallReminders from "@/app/UiComponents/DataViewer/leads/CallReminders.jsx";
import LeadNotes from "@/app/UiComponents/DataViewer/leads/LeadNotes.jsx";
import FileList from "@/app/UiComponents/DataViewer/leads/FileList.jsx";
import { GoPaperclip } from "react-icons/go";
import { PiCurrencyDollarSimpleLight } from "react-icons/pi";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { generatePDF } from "@/app/UiComponents/buttons/GenerateLeadPdf.jsx";
import dayjs from "dayjs";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";

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
  admin,
  isPage,
}) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { setLoading } = useToastContext();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPriceModel, setOpenPriceModel] = useState(null);
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
  const handleClick = (event) => {
    if (!admin) {
      setAnchorEl(event.currentTarget);
    } else if (
      (admin && lead.status === "FINALIZED") ||
      lead.status === "REJECTED"
    ) {
      setAnchorEl(event.currentTarget);
    }
  };
  const [finalizeModel, setFinalizeModel] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const handleMenuClose = async (value) => {
    if (value === "FINALIZED") {
      setCurrentId(lead.id);
      setFinalizeModel(true);
      return;
    }
    const request = await handleRequestSubmit(
      { status: value, oldStatus: lead.status, isAdmin: user.role === "ADMIN" },
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

  const leadStatus = enumToKeyValueArray(KanbanLeadsStatus);
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
            <Typography variant="h6">{lead.client.name}</Typography>
          </Stack>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            alignItems={{ sm: "center" }}
            justifyContent="flex-end"
          >
            {isPage && user.id !== lead.userId && !admin ? (
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
                  <Button
                    fullWidth={isMobile}
                    variant="outlined"
                    startIcon={!admin && <AiOutlineSwap />}
                    aria-controls={openPriceModel ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={openPriceModel ? "true" : undefined}
                    onClick={() => setOpenPriceModel(true)}
                    sx={{
                      fontWeight: 500,
                      borderRadius: "50px",
                    }}
                  >
                    Final price : {lead.averagePrice}
                  </Button>
                )}
                {!admin && lead.status !== "FINALIZED" && (
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
            <Button onClick={() => generatePDF(lead)}>Generate pdf</Button>
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
        variant={isMobile ? "scrollable" : "standard"}
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
          <LeadNotes
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <PriceOffersList
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={4}>
          <FileList
            admin={admin}
            lead={lead}
            notUser={isPage && user.id !== lead.userId}
          />
        </TabPanel>
      </Box>
    </>
  );
};

function WhatsAppRedirect({ lead }) {
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  // UAE Country Code
  const UAE_COUNTRY_CODE = "+971";

  // Function to format the phone number correctly
  const formatPhoneNumber = (phone, emirates) => {
    if (!phone) return null;

    let formattedPhone = phone.trim();

    // If lead is OUTSIDE UAE, assume number is already formatted
    if (emirates === "OUTSIDE") {
      return formattedPhone.startsWith("+")
        ? formattedPhone
        : `+${formattedPhone}`;
    }

    // If lead is inside UAE, check if the number already has country code
    if (!formattedPhone.startsWith(UAE_COUNTRY_CODE)) {
      // If number starts with 0, remove it and add the country code
      if (formattedPhone.startsWith("0")) {
        formattedPhone = formattedPhone.slice(1);
      }
      formattedPhone = UAE_COUNTRY_CODE + formattedPhone;
    }

    return formattedPhone;
  };

  // Function to detect device type
  const isMobileDevice = () => {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  // Handle click to open WhatsApp
  const handleWhatsAppClick = (e) => {
    e.preventDefault();

    const formattedPhone = formatPhoneNumber(lead.client.phone, lead.emirate);
    if (!formattedPhone) {
      alert("Invalid phone number");
      return;
    }

    // Open WhatsApp URL based on device type
    // const whatsappUrl = isMobileDevice()
    //   ? `whatsapp://send?phone=${formattedPhone}`
    //   : `https://web.whatsapp.com/send?phone=${formattedPhone}`;

    // Copy phone number to clipboard
    navigator.clipboard.writeText(formattedPhone).then(() => {
      setOpenSnackbar(true); // Show notification

      // Redirect after 1.5 seconds
      setTimeout(() => {
        window.open(`whatsapp://send?phone=${formattedPhone}`, "_blank");
      }, 100);
    });
  };

  return (
    <>
      <Typography color="text.secondary" variant="caption">
        Client Phone
      </Typography>
      <Typography
        variant="body1"
        component="a"
        onClick={handleWhatsAppClick}
        sx={{
          display: "block",
          color: "green",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {lead.client.phone} 📱
      </Typography>

      {/* Snackbar Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          📋 Copied Phone Number! Redirecting to WhatsApp...
        </Alert>
      </Snackbar>
    </>
  );
}

export function EmailRedirect({ email }) {
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleClick = (e) => {
    e.preventDefault(); // Prevent default link behavior

    // Copy email to clipboard
    navigator.clipboard.writeText(email).then(() => {
      setOpenSnackbar(true); // Show notification

      // Redirect after a short delay
      setTimeout(() => {
        window.open(
          "https://panel.dreamstudiio.com:8090/snappymail/",
          "_blank"
        );
      }, 1500);
    });
  };

  return (
    <>
      <Typography
        variant="body1"
        component="a"
        onClick={handleClick}
        sx={{
          display: "block",
          color: "blue",
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        {email}
      </Typography>

      {/* Snackbar Notification */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          📋 Copied Email! Redirecting to SnappyMail...
        </Alert>
      </Snackbar>
    </>
  );
}
function LeadData({ lead }) {
  const theme = useTheme();
  return (
    <Stack spacing={3}>
      <InfoCard title="Lead Information" icon={BsBuilding} theme={theme}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography color="text.secondary" variant="caption">
              Category
            </Typography>
            <Typography variant="body1">
              {LeadCategory[lead.selectedCategory]}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography color="text.secondary" variant="caption">
              Location
            </Typography>
            <Typography variant="body1">
              {lead.country ? lead.country : lead.emirate}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography color="text.secondary" variant="caption">
              Client price range
            </Typography>
            <Typography variant="body1">AED {lead.price}</Typography>
          </Grid>
          {lead.status === "FINALIZED" && (
            <>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography color="text.secondary" variant="caption">
                  Discount
                </Typography>
                <Typography variant="body1">{lead.discount}%</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography color="text.secondary" variant="caption">
                  Final price
                </Typography>
                <Typography variant="body1">AED {lead.averagePrice}</Typography>
              </Grid>
            </>
          )}
          <Grid size={{ xs: 12 }}>
            <Typography color="text.secondary" variant="caption">
              Description
            </Typography>
            <Typography variant="body1">{lead.description}</Typography>
          </Grid>
          {lead.clientDescription && (
            <Grid size={{ xs: 12 }}>
              <Typography color="text.secondary" variant="caption">
                Client description
              </Typography>
              <Typography variant="body1">{lead.clientDescription}</Typography>
            </Grid>
          )}
          {lead.timeToContact && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography color="text.secondary" variant="caption">
                Client selected time to contact
              </Typography>
              <Typography variant="body1">
                {dayjs(lead.timeToContact).format("DD-MM-YYYY, HH:mm")}
              </Typography>
            </Grid>
          )}
        </Grid>
      </InfoCard>

      <InfoCard title="Contact Information" icon={BsPerson} theme={theme}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography color="text.secondary" variant="caption">
              Client Name
            </Typography>
            <Typography variant="body1">{lead.client.name}</Typography>

            <WhatsAppRedirect lead={lead} />
            <Typography color="text.secondary" variant="caption">
              Client Email
            </Typography>
            <EmailRedirect email={lead.client.email} />
          </Grid>
          {lead.assignedTo && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography color="text.secondary" variant="caption">
                Assigned To
              </Typography>
              <Typography variant="body1">{lead.assignedTo.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {lead.assignedTo.email}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Assigned at : {dayjs(lead.assignedAt).format("DD/MM/YYYY")}
              </Typography>
            </Grid>
          )}
        </Grid>
      </InfoCard>
    </Stack>
  );
}

// InfoCard Component (No major changes, just accept theme as prop)
const InfoCard = ({ title, icon: Icon, children, theme }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      borderRadius: 2,
      "&:hover": {
        boxShadow: theme.shadows[2],
        transition: "box-shadow 0.3s ease-in-out",
      },
    }}
  >
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Icon size={18} color={theme.palette.primary.main} />
        <Typography variant="subtitle1">{title}</Typography>
      </Stack>
      {children}
    </Stack>
  </Paper>
);

// PreviewDialog Component with Conditional Rendering
const PreviewDialog = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  admin,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  useEffect(() => {
    async function getALeadDetails() {
      if (open) {
        const leadDetails = await getData({
          url: `shared/client-leads/${id}`,
          setLoading,
        });
        setLead(leadDetails.data);
      }
    }
    getALeadDetails();
  }, [id, open]);

  const handlePageClose = (isPage) => {
    console.log(isPage, "isPage");
    if (isPage) {
      window.history.back();
      return;
    }
    if (onClose) onClose();
  };
  return (
    <>
      {page ? (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          {loading ? (
            <FullScreenLoader />
          ) : (
            <LeadContent
              lead={lead}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              theme={theme}
              isMobile={isMobile}
              handleClose={handlePageClose}
              setLead={setLead}
              setleads={setleads}
              admin={admin}
              isPage={page}
            />
          )}
        </Container>
      ) : (
        // Render as a Dialog
        <Dialog
          open={open}
          onClose={onClose}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
          fullScreen={isMobile}
        >
          {loading ? (
            <FullScreenLoader />
          ) : (
            <>
              <LeadContent
                lead={lead}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                theme={theme}
                isMobile={isMobile}
                handleClose={handlePageClose}
                setLead={setLead}
                setleads={setleads}
                admin={admin}
              />
              <DialogActions
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: "divider",
                  gap: 1,
                }}
              >
                <Button onClick={onClose} variant="outlined">
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      )}
    </>
  );
};

export default PreviewDialog;
