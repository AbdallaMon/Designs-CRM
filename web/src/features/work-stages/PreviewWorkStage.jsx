"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  BsFileText,
  BsInfoCircle,
  BsPersonCheckFill,
  BsTelephone,
} from "react-icons/bs";
import { PROJECT_STATUSES, statusColors } from "@/app/helpers/constants";

import { checkIfAdmin } from "@/app/helpers/functions/utility.js";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import { GoPaperclip } from "react-icons/go";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
import { usePermission } from "@/app/hooks/usePermission";
import { PROJECT_CODES } from "@/app/helpers/permissionCodes";
import Link from "next/link";
import { LeadNotes } from "@/features/leads/tabs/LeadsNotes.jsx";
import { MdModeEdit, MdTask, MdWork } from "react-icons/md";
import LeadProjects from "@/features/work-stages/projects/LeadProjects.jsx";
import { TasksList } from "@/features/tasks/TasksList.jsx";
import { ProjectDetails } from "@/features/work-stages/projects/ProjectDetails.jsx";
import { InfoCard } from "@/features/leads/core/InfoCard.jsx";
import { LeadContactInfo } from "@/features/leads/panels/LeadContactInfo.jsx";
import { LeadInfo } from "@/features/leads/panels/LeadInfo.jsx";
import { PreviewLead } from "@/features/leads/features/PreviewLead.jsx";
import { CallReminders } from "@/features/leads/tabs/CallReminders.jsx";
import { FileList } from "@/features/leads/tabs/Files.jsx";
import { TabPanel } from "@/features/leads/shared/TabPanel.jsx";
import { WorkStageDialogHeader } from "@/features/leads/shared/WorkStageDialogHeader.jsx";

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
  dontCheckIfNotUser,
  setRerenderColumns,
}) => {
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  const { hasPermission } = usePermission();
  // Intentional, approved normalization: the admin-only "Projects" tab / view-all button
  // (legacy exact-role `ADMIN || SUPER_ADMIN`) now gate on the `project.manage` code, which
  // is the admin-tier management set (ADMIN/SUPER_ADMIN + isSuperSales). Used as the single
  // predicate for both the Projects branch and its complementary Tasks branch so the tab
  // indices stay in sync (exactly one of the two renders at index 4).
  const canManageProjects = hasPermission(PROJECT_CODES.MANAGE);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { setLoading } = useToastContext();

  const handleMenuClose = async (value) => {
    const request = await handleRequestSubmit(
      {
        status: value,
        oldStatus: lead.projects[0].status,
        isAdmin: isAdmin,
        id: lead.projects[0].id,
      },
      setLoading,
      `shared/designers/${lead.id}/actions/change-status`,
      false,
      "Updating",
      null,
      "POST"
    );
    if (request.status === 200) {
      if (setRerenderColumns) {
        setRerenderColumns((prev) => ({
          ...prev,
          [lead.projects[0].status]: !prev[lead.projects[0].status],
          [value]: !prev[value],
        }));
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

  const isNotUser = () => {
    if (lead.projects.length === 0) return false;
    return lead.projects[0].assignments?.some(
      (assignment) => assignment.user?.id === user.id
    )
      ? false
      : true;
  };

  const notUser = isNotUser(user);
  const modificationProject = lead.projects?.filter(
    (project) => project.status === "Modification"
  );

  const projectStatuses = lead.projects?.[0]?.type
    ? PROJECT_STATUSES[lead.projects[0].type]
    : [];

  return (
    <>
      {/* Header */}
      <WorkStageDialogHeader
        lead={lead}
        theme={theme}
        handleClose={handleClose}
        isPage={isPage}
        admin={isAdmin}
        user={user}
        setLead={setLead}
        dealLink={`/dashboard/deals/${lead.id}`}
        twoDLink={
          lead.twoDDesignerId ? `/dashboard/work-stages/two-d/${lead.id}` : null
        }
      />

      {/* Project Status Menu */}
      {lead.projects?.map((project) => (
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          key={project.id}
          open={open}
          onClose={() => setAnchorEl(null)}
          MenuListProps={{
            "aria-labelledby": "basic-button",
          }}
        >
          {projectStatuses.map((status) => (
            <MenuItem
              key={status}
              value={status}
              onClick={() => handleMenuClose(status)}
            >
              Type: {project.type} - {status}
            </MenuItem>
          ))}
        </Menu>
      ))}
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
        {!canManageProjects && (
          <Tab
            icon={<MdTask size={20} />}
            label="Tasks"
            sx={{ textTransform: "none" }}
          />
        )}
        {canManageProjects && (
          <Tab
            icon={<MdWork size={20} />}
            label="Projects"
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
          <LeadNotes
            admin={isAdmin}
            lead={lead}
            notUser={!dontCheckIfNotUser}
          />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <FileList admin={isAdmin} lead={lead} notUser={isPage && notUser} />
        </TabPanel>
        {canManageProjects && (
          <TabPanel value={activeTab} index={4}>
            <LeadProjects clientLeadId={lead.id} />
          </TabPanel>
        )}
        {!canManageProjects && (
          <TabPanel value={activeTab} index={4}>
            <TasksList projectId={lead.projects[0].id} type="PROJECT" />
          </TabPanel>
        )}
        {(type === "3D_Modification" ||
          (type === "3D_Designer" && modificationProject)) && (
          <TabPanel value={activeTab} index={5}>
            <TasksList
              name="Modification"
              type="MODIFICATION"
              clientLeadId={lead.id}
            />
          </TabPanel>
        )}
      </Box>
    </>
  );
};

function LeadData({ lead }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  // Same approved normalization as above: admin-tier "view all client projects" gates on
  // the `project.manage` code (adds isSuperSales) rather than exact ADMIN/SUPER_ADMIN role.
  const canManageProjects = hasPermission(PROJECT_CODES.MANAGE);
  return (
    <Stack spacing={3}>
      {user.role !== "STAFF" && (
        <>
          {" "}
          <LeadInfo lead={lead} />
          <InfoCard
            title="Related Projects"
            icon={BsPersonCheckFill}
            theme={theme}
          >
            <>
              {canManageProjects && (
                <Button
                  variant="contained"
                  color="primary"
                  component="a"
                  href={`/dashboard/projects/grouped/${lead.id}`}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                >
                  See all the projects of this lead
                </Button>
              )}
              {lead.projects?.map((project) => {
                return (
                  <Paper
                    key={project.id}
                    elevation={0}
                    sx={{
                      bgcolor: "background.paper",
                      p: { xs: 2, md: 2.5 },
                      borderRadius: 4,
                      border: (t) => `1px solid ${t.palette.divider}`,
                    }}
                  >
                    <Box
                      display="flex"
                      gap={1.5}
                      alignItems="center"
                      flexWrap="wrap"
                      mb={2}
                    >
                      <Button
                        variant="outlined"
                        color="primary"
                        component="a"
                        href={`/dashboard/projects/${project.id}`}
                        sx={{ mb: 0, textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                      >
                        See the project #{project.id}
                      </Button>
                      <Chip
                        label={project.type.replace(/_/g, " ")}
                        variant="outlined"
                        sx={{ fontWeight: 600, borderRadius: 2 }}
                      />
                    </Box>
                    <ProjectDetails
                      project={project}
                      isStaff={
                        user.role !== "ADMIN" && user.role !== "SUPER_ADMIN"
                      }
                      withReleventLinks={true}
                    />
                  </Paper>
                );
              })}
            </>
          </InfoCard>
        </>
      )}
      {user.role === "STAFF" ||
        user.role === "ACCOUNTANT" ||
        user.role === "SUPER_ADMIN" ||
        (user.role === "ADMIN" && (
          <>
            <LeadContactInfo lead={lead} />
          </>
        ))}
    </Stack>
  );
}

const PreviewWorkStage = ({
  open,
  onClose,
  id,
  setleads,
  page = false,
  type,
  setRerenderColumns,
}) => {
  return (
    <PreviewLead
      leadContent={LeadContent}
      id={id}
      open={open}
      onClose={onClose}
      setleads={setleads}
      page={page}
      url={`shared/projects/designers/${id}?type=${type}&`}
      type={type}
      dontCheckIfNotUser={true}
      setRerenderColumns={setRerenderColumns}
    />
  );
};

export default PreviewWorkStage;
