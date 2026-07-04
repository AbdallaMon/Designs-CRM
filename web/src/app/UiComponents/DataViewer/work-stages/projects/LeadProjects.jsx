"use client";
import React, { useState, useEffect } from "react";
import { TabLoading } from "../../leads/shared/TabLoading";
import { EmptyState } from "../../leads/shared/EmptyState";
import {
  TabSection,
  RecordCard,
  StatusPill,
} from "../../leads/shared/tabKit";
import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Typography,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import { getData } from "@/app/helpers/functions/getData";
import { ProjectDetails } from "./ProjectDetails";
import {
  MdFolder,
  MdRefresh,
  MdAdd,
  MdFolder as FolderIcon,
  MdWork,
  MdAssignment,
  MdArchitecture,
  Md3dRotation,
  MdDraw,
  MdOutlineEditNote,
  MdCalculate,
  MdBrush,
} from "react-icons/md";
import CreateProjectsGroup from "./CreateNewProjectsGroup";

export const getProjectIcon = (type) => {
  const iconSize = 20;

  switch (type) {
    case "3D_Designer":
      return <Md3dRotation size={iconSize} />;

    case "3D_Modification":
      return <MdArchitecture size={iconSize} />;

    case "2D_Study":
      return <MdDraw size={iconSize} />;

    case "2D_Final_Plans":
      return <MdOutlineEditNote size={iconSize} />;

    case "2D_Quantity_Calculation":
      return <MdCalculate size={iconSize} />;

    default:
      // For any other case or future additions
      if (type.startsWith("3D")) {
        return <Md3dRotation size={iconSize} />;
      } else if (type.startsWith("2D")) {
        return <MdBrush size={iconSize} />;
      }

      return <MdAssignment size={iconSize} />;
  }
};

// Main component
export const LeadProjects = ({
  clientLeadId,
  noIntialLoad = false,
  initialProjects,
  framed = true,
  showLeadLink = false,
}) => {
  const theme = useTheme();
  const [groupedProjects, setGroupedProjects] = useState([]);
  const [loading, setLoading] = useState(!noIntialLoad);
  const [error, setError] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [activeGroupTab, setActiveGroupTab] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [projectContextMenu, setProjectContextMenu] = useState({
    open: false,
    project: null,
    anchorEl: null,
  });
  useEffect(() => {
    if (noIntialLoad) {
      setGroupedProjects(initialProjects);
    } else {
      loadProjects();
    }
  }, [clientLeadId]);

  const loadProjects = async () => {
    setLoading(true);
    setError(false);

    const projectsReq = await getData({
      url: `shared/projects?clientLeadId=${clientLeadId}&`,
      setLoading,
    });
    if (projectsReq.status === 200) {
      setGroupedProjects(projectsReq.data);
      if (
        projectsReq.data.length > 0 &&
        projectsReq.data[0].projects.length > 0
      ) {
        setActiveProject(projectsReq.data[0].projects[0]);
      }
    } else {
      setError(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };
  const handleProjectUpdate = (updatedProject) => {
    const updatedGroups = groupedProjects.map((group) => {
      const updatedProjects = group.projects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      );
      return { ...group, projects: updatedProjects };
    });

    setGroupedProjects(updatedGroups);

    if (activeProject && activeProject.id === updatedProject.id) {
      setActiveProject(updatedProject);
    }
  };

  function onGroupCreated(newGroup) {
    handleRefresh();
  }

  const handleProjectClick = (project) => {
    setActiveProject(project);
    setProjectContextMenu({ open: false, project: null, anchorEl: null });
  };

  const handleGroupTabChange = (event, newValue) => {
    setActiveGroupTab(newValue);
    // Set the first project of the selected group as active
    if (
      groupedProjects[newValue] &&
      groupedProjects[newValue].projects.length > 0
    ) {
      setActiveProject(groupedProjects[newValue].projects[0]);
    } else {
      setActiveProject(null);
    }
  };

  const handleProjectContextMenu = (event, project) => {
    event.preventDefault();
    setProjectContextMenu({
      open: true,
      project,
      anchorEl: event.currentTarget,
    });
  };

  const closeProjectContextMenu = () => {
    setProjectContextMenu({ open: false, project: null, anchorEl: null });
  };

  // Wraps the body in the outer Card only when `framed` (standalone pages); inside the
  // lead workspace rail (`framed={false}`) it sits flush like the other tabs.
  const Frame = ({ children }) =>
    framed ? (
      <Card elevation={3}>
        <CardContent>{children}</CardContent>
      </Card>
    ) : (
      <>{children}</>
    );

  // Loading state
  if (loading) {
    return <TabLoading minHeight={300} />;
  }

  // Error state
  if (error) {
    return (
      <Frame>
        <TabSection icon={<MdWork />} title="Projects">
          <EmptyState
            icon={<MdFolder />}
            title="Failed to load projects"
            description="An error occurred while loading projects. Please try again."
            action={
              <Button
                variant="outlined"
                onClick={handleRefresh}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Retry
              </Button>
            }
          />
        </TabSection>
      </Frame>
    );
  }

  // Empty state (no groups at all)
  if (!groupedProjects || groupedProjects.length === 0) {
    return (
      <Frame>
        <TabSection
          icon={<MdWork />}
          title="Projects"
          count={0}
          action={
            <CreateProjectsGroup
              clientLeadId={clientLeadId}
              onGroupCreated={onGroupCreated}
            />
          }
        >
          <EmptyState
            icon={<MdFolder />}
            title="No Projects Found"
            description="Start by creating a new project group to organize your work"
            action={
              <CreateProjectsGroup
                clientLeadId={clientLeadId}
                onGroupCreated={onGroupCreated}
                buttonProps={{
                  variant: "contained",
                  startIcon: <MdAdd />,
                  children: "Create First Project Group",
                }}
              />
            }
          />
        </TabSection>
      </Frame>
    );
  }

  const currentGroup = groupedProjects[activeGroupTab] || {};
  const currentProjects = currentGroup.projects || [];

  return (
    <Frame>
      <TabSection
        icon={<MdWork />}
        title="Projects"
        count={currentProjects.length}
        description={currentGroup.groupTitle || undefined}
        action={
          <Box display="flex" gap={1} alignItems="center">
            {showLeadLink && (
              <Button
                component="a"
                href={`/dashboard/deals/${clientLeadId}`}
                size="small"
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {`Lead #${clientLeadId}`}
              </Button>
            )}
            <Tooltip title="Refresh projects">
              <IconButton
                onClick={handleRefresh}
                color="primary"
                size="small"
                disabled={refreshing}
              >
                <MdRefresh className={refreshing ? "spin" : ""} />
              </IconButton>
            </Tooltip>
            <CreateProjectsGroup
              clientLeadId={clientLeadId}
              onGroupCreated={onGroupCreated}
            />
          </Box>
        }
      >
        {/* Group switcher */}
        {groupedProjects.length > 1 && (
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeGroupTab}
              onChange={handleGroupTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              textColor="primary"
              indicatorColor="primary"
            >
              {groupedProjects.map((group) => (
                <Tab
                  key={group.groupId}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <FolderIcon size={18} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {group.groupTitle}
                      </Typography>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.1,
                          borderRadius: 1.5,
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.12),
                        }}
                      >
                        {group.projects.length}
                      </Box>
                    </Box>
                  }
                  sx={{ textTransform: "none", minHeight: 48 }}
                />
              ))}
            </Tabs>
          </Box>
        )}

        {/* Project chips */}
        {currentProjects.length === 0 ? (
          <EmptyState
            icon={<MdFolder />}
            title="No projects in this group"
            description="Add projects to this group to see them here."
          />
        ) : (
          <Box display="flex" gap={1} flexWrap="wrap">
            {currentProjects.map((project) => {
              const isActive = activeProject && activeProject.id === project.id;
              return (
                <Chip
                  key={project.id}
                  label={project.type.replace(/_/g, " ")}
                  onClick={() => handleProjectClick(project)}
                  onContextMenu={(e) => handleProjectContextMenu(e, project)}
                  icon={getProjectIcon(project.type)}
                  color={isActive ? "primary" : "default"}
                  variant={isActive ? "filled" : "outlined"}
                  sx={{
                    px: 1,
                    py: 2.5,
                    borderRadius: 1.5,
                    border: (t) =>
                      isActive
                        ? `1px solid ${t.palette.primary.main}`
                        : `1px solid ${t.palette.divider}`,
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              );
            })}
          </Box>
        )}

        <Menu
          open={projectContextMenu.open}
          onClose={closeProjectContextMenu}
          anchorEl={projectContextMenu.anchorEl}
        >
          <MenuItem
            onClick={() => {
              handleProjectClick(projectContextMenu.project);
              closeProjectContextMenu();
            }}
          >
            View Project
          </MenuItem>
        </Menu>

        {/* Active project details */}
        {activeProject ? (
          <RecordCard
            accent={
              activeProject.status === "Completed"
                ? theme.palette.success.main
                : theme.palette.primary.main
            }
            leading={
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                  flexShrink: 0,
                }}
              >
                {getProjectIcon(activeProject.type)}
              </Box>
            }
            title={activeProject.type.replace(/_/g, " ")}
            status={
              <StatusPill
                label={activeProject.status || "Active"}
                color={
                  activeProject.status === "Completed"
                    ? theme.palette.success.main
                    : theme.palette.primary.main
                }
              />
            }
          >
            <ProjectDetails
              project={activeProject}
              onUpdate={handleProjectUpdate}
            />
          </RecordCard>
        ) : (
          <EmptyState
            icon={<MdWork />}
            title="No Project Selected"
            description="Select a project to view details"
          />
        )}
      </TabSection>
    </Frame>
  );
};

export default LeadProjects;
