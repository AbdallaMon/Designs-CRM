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

import {
  checkIfADesigner,
  checkIfAdmin,
} from "@/app/helpers/functions/utility.js";
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
import { WorkStageCockpit } from "@/features/leads/cockpit/WorkStageCockpit.jsx";

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
  initialTabExplicit,
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

  const projectStatuses = lead.projects?.[0]?.type
    ? PROJECT_STATUSES[lead.projects[0].type]
    : [];

  // Key-based tab config — exactly one source of truth for which tabs exist, their
  // order, and visibility. Replaces the fragile index-4/index-5 coupling.
  const isDesignerView = checkIfADesigner(user) || user.role === "EXECUTOR";
  const showModifications =
    type === "3D_Modification" ||
    (type === "3D_Designer" && lead.projects[0]?.status === "Modification");

  const tabConfig = [
    { key: "details", label: "Details", icon: <BsInfoCircle size={20} />, visible: true },
    { key: "calls", label: "Calls", icon: <BsTelephone size={20} />, visible: true },
    { key: "notes", label: "Notes", icon: <BsFileText size={20} />, visible: true },
    { key: "attachments", label: "Attachments", icon: <GoPaperclip size={20} />, visible: true },
    { key: "work", label: "Work", icon: <MdTask size={20} />, visible: !canManageProjects },
    { key: "projects", label: "Projects", icon: <MdWork size={20} />, visible: canManageProjects },
    { key: "modifications", label: "Modifications", icon: <MdModeEdit size={20} />, visible: showModifications },
  ].filter((t) => t.visible);

  const visibleTabKeys = tabConfig.map((t) => t.key);
  // Clamp: an explicit/stale ?tab= that isn't visible for this viewer falls back to the first visible tab.
  const effectiveTab = visibleTabKeys.includes(activeTab)
    ? activeTab
    : visibleTabKeys[0];

  // usedExplicitTab: PreviewLead owns the URL param; this is the signal that the
  // preview opened with an explicit ?tab= value (page mode) vs. the default.
  const usedExplicitTab = { current: initialTabExplicit };

  // Per-role opening tab: designers/executors land on their WORK, sales/admin on lead
  // details. Only runs when the preview opened without an explicit ?tab= value.
  useEffect(() => {
    if (isDesignerView && activeTab === "details" && !usedExplicitTab.current) {
      setActiveTab(canManageProjects ? "projects" : "work");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Designer "what do I do next" — backend-computed, assignment-scoped */}
      <WorkStageCockpit actions={lead.workStageActions} />

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
        value={effectiveTab}
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
        {tabConfig.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            icon={t.icon}
            label={t.label}
            sx={{ textTransform: "none" }}
          />
        ))}
      </Tabs>

      <Box
        sx={{
          p: { xs: 2, md: 3 },
          overflowY: "auto",
          maxHeight: { md: "600px" },
        }}
      >
        <TabPanel value={effectiveTab} index="details">
          <LeadData lead={lead} admin={isAdmin} />
        </TabPanel>
        <TabPanel value={effectiveTab} index="calls">
          <CallReminders
            admin={isAdmin}
            lead={lead}
            setleads={setleads}
            notUser={isPage && notUser}
          />
        </TabPanel>
        <TabPanel value={effectiveTab} index="notes">
          <LeadNotes
            admin={isAdmin}
            lead={lead}
            notUser={!dontCheckIfNotUser}
          />
        </TabPanel>
        <TabPanel value={effectiveTab} index="attachments">
          <FileList admin={isAdmin} lead={lead} notUser={isPage && notUser} />
        </TabPanel>
        {!canManageProjects && (
          <TabPanel value={effectiveTab} index="work">
            {/* Project-first WORK tab: the consolidated project surface + open tasks */}
            {lead.projects?.map((project) => (
              <ProjectDetails
                key={project.id}
                project={project}
                onUpdate={
                  setLead
                    ? (updated) =>
                        setLead((old) => ({
                          ...old,
                          projects: old.projects.map((p) =>
                            p.id === updated.id ? { ...p, ...updated } : p
                          ),
                        }))
                    : undefined
                }
                withReleventLinks={false}
              />
            ))}
            {lead.projects?.[0] && (
              <TasksList projectId={lead.projects[0].id} type="PROJECT" />
            )}
          </TabPanel>
        )}
        {canManageProjects && (
          <TabPanel value={effectiveTab} index="projects">
            <LeadProjects clientLeadId={lead.id} />
          </TabPanel>
        )}
        {showModifications && (
          <TabPanel value={effectiveTab} index="modifications">
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
