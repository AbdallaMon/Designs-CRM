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
  LeadCategory,
  statusColors,
  ThreeDWorkStages,
  TwoDExacuterStages,
  TwoDWorkStages,
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
import { GoPaperclip } from "react-icons/go";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { generatePDF } from "@/app/UiComponents/buttons/GenerateLeadPdf.jsx";
import dayjs from "dayjs";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import Link from "next/link";
import {
  CallReminders,
  FileList,
  LeadNotes,
  OurCostAndContractorCost,
} from "../leads/LeadTabs";

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
  type,
}) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { setLoading } = useToastContext();
  async function createADeal(lead) {
    const type =
      user.role === "THREE_D_DESIGNER"
        ? "three-d"
        : user.role === "TWO_D_DESIGNER"
        ? "two-d"
        : "exacuter";

    const assign = await handleRequestSubmit(
      lead,
      setLoading,
      `shared/work-stages/assign?type=${type}&`,
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
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = async (value) => {
    if (user.role === "SUPER_ADMIN") {
      return;
    }
    const request = await handleRequestSubmit(
      {
        status: value,
        oldStatus:
          type === "three-d"
            ? lead.threeDWorkStage
            : type === "two-d"
            ? lead.twoDWorkStage
            : lead.twoDExacuterStage,
        isAdmin: isAdmin,
      },
      setLoading,
      `shared/work-stages/${lead.id}/status`,
      false,
      "Updating",
      null,
      "PUT"
    );
    if (request.status === 200) {
      const update =
        type === "three-d"
          ? { threeDWorkStage: value }
          : type === "two-d"
          ? { twoDWorkStage: value }
          : { twoDExacuterStage: value };
      if (setleads) {
        setleads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, ...update } : l))
        );
      }
      if (setLead) {
        setLead((oldLead) => ({ ...oldLead, ...update }));
      }
      setAnchorEl(null);
    }
  };

  const leadStatus =
    type === "three-d"
      ? enumToKeyValueArray(ThreeDWorkStages)
      : type === "two-d"
      ? enumToKeyValueArray(TwoDWorkStages)
      : enumToKeyValueArray(TwoDExacuterStages);
  const isNotUser = () => {
    if (type === "three-d") {
      return user.id !== lead.threeDDesignerId;
    } else if (type === "two-d") {
      return user.id !== lead.twoDDesignerId;
    } else {
      return user.id !== lead.twoDExacuterId;
    }
  };
  const notUser = isNotUser();
  return (
    <>
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
            {(lead.status === "NEW" || lead.status === "ON_HOLD") &&
            !isAdmin ? (
              ""
            ) : (
              <Typography variant="h6">
                #{lead.id} {lead.client.name}
              </Typography>
            )}
          </Stack>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            alignItems={{ sm: "center" }}
            justifyContent="flex-end"
          >
            {isPage &&
            ((!lead.twoDDesignerId && type === "two-d") ||
              (!lead.threeDDesignerId && type === "three-d") ||
              (!lead.twoDExacuterId && type === "excauter")) &&
            !isAdmin ? (
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
                {isAdmin && (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      type={Link}
                      href={`/dashboard/deals/${lead.id}`}
                    >
                      See the deal
                    </Button>
                    {lead.twoDDesignerId && (
                      <Button
                        variant="outlined"
                        color="primary"
                        type={Link}
                        href={`/dashboard/work-stages/two-d/${lead.id}`}
                      >
                        See the two d lead
                      </Button>
                    )}
                  </>
                )}
                <Button
                  fullWidth={isMobile}
                  variant="contained"
                  startIcon={!isAdmin && <AiOutlineSwap />}
                  aria-controls={open ? "basic-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                  onClick={handleClick}
                  sx={{
                    background:
                      statusColors[
                        type === "three-d"
                          ? lead.threeDWorkStage
                          : type === "two-d"
                          ? lead.twoDWorkStage
                          : lead.twoDExacuterStage
                      ],
                    fontWeight: 500,
                    borderRadius: "50px",
                  }}
                >
                  {type === "three-d"
                    ? ThreeDWorkStages[lead.threeDWorkStage]
                    : type == "two-d"
                    ? TwoDWorkStages[lead.twoDWorkStage]
                    : TwoDExacuterStages[lead.twoDExacuterStage]}
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
          icon={<GoPaperclip size={20} />}
          label="Attatchments"
          sx={{ textTransform: "none" }}
        />
        {type === "exacuter" && (
          <Tab
            icon={<GoPaperclip size={20} />}
            label="Our cost and constructor cost"
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
          <LeadData lead={lead} admin={isAdmin} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <CallReminders
            admin={isAdmin}
            lead={lead}
            setleads={setleads}
            notUser={isPage && notUser}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <LeadNotes admin={isAdmin} lead={lead} notUser={isPage && notUser} />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <FileList admin={isAdmin} lead={lead} notUser={isPage && notUser} />
        </TabPanel>
        {type === "exacuter" && (
          <TabPanel value={activeTab} index={4}>
            <OurCostAndContractorCost lead={lead} setLead={setLead} />
          </TabPanel>
        )}
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
              <Typography
                variant="body1"
                component="pre"
                sx={{ textWrap: "auto", wordBreak: "break-all" }}
              >
                {lead.clientDescription}
              </Typography>
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

      {(lead.status === "NEW" || lead.status === "ON_HOLD") && !isAdmin ? (
        ""
      ) : (
        <>
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
                  <Typography variant="body1">
                    {lead.assignedTo.name}
                  </Typography>
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
        </>
      )}
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

const PreviewWorkStage = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  type,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState(null);
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  useEffect(() => {
    async function getALeadDetails() {
      if (open) {
        const leadDetails = await getData({
          url: `shared/work-stage-leads/${id}`,
          setLoading,
        });
        setLead(leadDetails.data);
      }
    }
    getALeadDetails();
  }, [id, open]);

  const handlePageClose = (isPage) => {
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
              admin={isAdmin}
              isPage={page}
              type={type}
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
                admin={isAdmin}
                type={type}
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

export default PreviewWorkStage;
