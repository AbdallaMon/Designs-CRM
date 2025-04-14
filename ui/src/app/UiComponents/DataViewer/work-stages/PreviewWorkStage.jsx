"use client";
import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  BsArrowLeft,
  BsFileText,
  BsInfoCircle,
  BsPersonCheckFill,
  BsTelephone,
} from "react-icons/bs";
import { PROJECT_STATUSES, statusColors } from "@/app/helpers/constants.js";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader.jsx";
import { getData } from "@/app/helpers/functions/getData.js";
import { AiOutlineSwap } from "react-icons/ai";
import { checkIfAdmin } from "@/app/helpers/functions/utility.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { GoPaperclip } from "react-icons/go";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { generatePDF } from "@/app/UiComponents/buttons/GenerateLeadPdf.jsx";
import Link from "next/link";
import { CallReminders, FileList, LeadNotes } from "../leads/LeadTabs";
import { MdModeEdit, MdTask, MdWork, MdWorkHistory } from "react-icons/md";
import LeadProjects from "./projects/LeadProjects";
import { TasksList } from "./projects/TasksList";
import { ProjectDetails } from "./projects/ProjectDetails";
import TelegramLink from "./TelegramLink";
import { InfoCard } from "../leads/extra/InfoCard";
import { LeadContactInfo } from "../leads/extra/LeadContactInfo";
import { LeadInfo } from "../leads/extra/LeadInfo";
import { PreviewLead } from "../leads/extra/PreviewLead";

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
        oldStatus: lead.projects[0].status,
        isAdmin: isAdmin,
        id: lead.projects[0].id,
      },
      setLoading,
      `shared/client-leads/designers/${lead.id}/status`,
      false,
      "Updating",
      null,
      "PUT"
    );
    if (request.status === 200) {
      if (setleads) {
        setleads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? {
                  ...l,
                  projects: l.projects.map((project, index) =>
                    index === 0 ? { ...project, status: value } : project
                  ),
                }
              : l
          )
        );
      }
      if (setLead) {
        setLead((oldLead) => ({
          ...oldLead,
          projects: oldLead.projects.map((project, index) =>
            index === 0 ? { ...project, status: value } : project
          ),
        }));
      }
      setAnchorEl(null);
    }
  };
  const leadStatus = PROJECT_STATUSES[type];
  const isNotUser = () => {
    return user.id !== lead.projects[0].userId;
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
                #{lead.id.toString().padStart(7, "0")} {lead.client.name}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <TelegramLink lead={lead} setLead={setLead} />
          </Stack>
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            alignItems={{ sm: "center" }}
            justifyContent="flex-end"
          >
            {
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
                    background: statusColors[lead.projects[0].status],
                    fontWeight: 500,
                    borderRadius: "50px",
                  }}
                >
                  {lead.projects[0].status}
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
                  {leadStatus.map((status) => (
                    <MenuItem
                      key={status}
                      value={status}
                      onClick={() => handleMenuClose(status)}
                    >
                      {status}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            }
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
        {user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && (
          <Tab
            icon={<MdTask size={20} />}
            label="Tasks"
            sx={{ textTransform: "none" }}
          />
        )}
        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") &&
          lead.status === "FINALIZED" && (
            <Tab
              icon={<MdWork size={20} />}
              label="Projects"
              sx={{ textTransform: "none" }}
            />
          )}
        {type === "three-d" && (
          <Tab
            icon={<MdWorkHistory size={20} />}
            label="Work status"
            sx={{ textTransform: "none" }}
          />
        )}
        {type === "exacuter" && (
          <Tab
            icon={<GoPaperclip size={20} />}
            label="Our cost and constructor cost"
            sx={{ textTransform: "none" }}
          />
        )}
        {(type === "3D_Modification" ||
          (type === "3D_Designer" &&
            lead.projects[0].status === "Modification")) && (
          <Tab
            icon={<MdModeEdit size={20} />}
            label="Modificaions"
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
        {user.role === "ADMIN" && user.role === "SUPER_ADMIN" && (
          <TabPanel value={activeTab} index={4}>
            <LeadProjects clientLeadId={lead.id} />
          </TabPanel>
        )}
        {user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && (
          <TabPanel value={activeTab} index={4}>
            <TasksList projectId={lead.projects[0].id} type="PROJECT" />
          </TabPanel>
        )}
        {(type === "3D_Modification" ||
          (type === "3D_Designer" &&
            lead.projects[0].status === "Modification")) && (
          <TabPanel value={activeTab} index={5}>
            <TasksList
              name="Modifcation"
              type="MODIFICATION"
              clientLeadId={lead.id}
            />
          </TabPanel>
        )}
        {/* {type === "three-d" && (
          <TabPanel value={activeTab} index={4}>
            <WorkStageComponent
              clientLeadId={lead.id}
              stage={lead.threeDWorkStage}
              userId={lead.threeDDesignerId}
            />
          </TabPanel>
        )}

        {type === "exacuter" && (
          <TabPanel value={activeTab} index={4}>
            <OurCostAndContractorCost lead={lead} setLead={setLead} />
          </TabPanel>
        )} */}
      </Box>
    </>
  );
};

function LeadData({ lead }) {
  const theme = useTheme();
  return (
    <Stack spacing={3}>
      <LeadInfo lead={lead} />
      <LeadContactInfo lead={lead} />
      <InfoCard title="Project info" icon={BsPersonCheckFill} theme={theme}>
        <ProjectDetails project={lead.projects[0]} isStaff={true} />
      </InfoCard>
    </Stack>
  );
}

// InfoCard Component (No major changes, just accept theme as prop)

const PreviewWorkStage = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  type,
}) => {
  return (
    <PreviewLead
      leadContent={LeadContent}
      id={id}
      open={open}
      onClose={onClose}
      setleads={setleads}
      page={page}
      url={`shared/client-leads/projects/designers/${id}?type=${type}&`}
      type={type}
    />
  );
};

export default PreviewWorkStage;
