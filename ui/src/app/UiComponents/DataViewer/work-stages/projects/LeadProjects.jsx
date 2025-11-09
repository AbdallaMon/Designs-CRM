"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Avatar,
  Menu,
  MenuItem,
  Button,
} from "@mui/material";
import { getData } from "@/app/helpers/functions/getData";
import { ProjectDetails } from "./ProjectDetails";
import {
  MdFolder,
  MdRefresh,
  MdAdd,
  MdFolder as FolderIcon,
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
// Function to get random pastel color for avatars - ensures consistency for same project type
const getAvatarColor = (type) => {
  const colors = [
    "#E57373",
    "#F06292",
    "#BA68C8",
    "#9575CD",
    "#7986CB",
    "#64B5F6",
    "#4FC3F7",
    "#4DD0E1",
    "#4DB6AC",
    "#81C784",
    "#AED581",
    "#DCE775",
    "#FFD54F",
    "#FFB74D",
    "#FF8A65",
  ];

  // Simple hash function for string
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

// Main component
export const LeadProjects = ({
  clientLeadId,
  noIntialLoad = false,
  initialProjects,
}) => {
  const [groupedProjects, setGroupedProjects] = useState([]);
  const [loading, setLoading] = useState(!noIntialLoad);
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

  // Loading state
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="300px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Empty state
  if (groupedProjects.length === 0) {
    return (
      <Card elevation={3}>
        <CardHeader
          title="Projects Dashboard"
          action={
            <CreateProjectsGroup
              clientLeadId={clientLeadId}
              onGroupCreated={onGroupCreated}
            />
          }
        />
        <Divider />
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
          >
            <Avatar
              sx={{ width: 80, height: 80, mb: 2, bgcolor: "primary.light" }}
            >
              <MdFolder size={40} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              No Projects Found
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              mb={3}
            >
              Start by creating a new project group to organize your work
            </Typography>
            <CreateProjectsGroup
              clientLeadId={clientLeadId}
              onGroupCreated={onGroupCreated}
              buttonProps={{
                variant: "contained",
                startIcon: <MdAdd />,
                children: "Create First Project Group",
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const currentGroup = groupedProjects[activeGroupTab] || {};

  return (
    <Card elevation={3}>
      <CardHeader
        title={
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" gap={2}>
              <Typography variant="h5" fontWeight="500">
                {currentGroup.groupTitle || "Projects Dashboard"}
              </Typography>
              <Button component="a" href={`/dashboard/deals/${clientLeadId}`}>
                Lead # {clientLeadId}
              </Button>
            </Box>
            <Box display="flex" gap={1}>
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
          </Box>
        }
      />
      <Divider />

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeGroupTab}
          onChange={handleGroupTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          textColor="primary"
          indicatorColor="primary"
          sx={{ px: 2 }}
        >
          {groupedProjects.map((group, index) => (
            <Tab
              key={group.groupId}
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <FolderIcon size={18} />
                  <Typography variant="body2">{group.groupTitle}</Typography>
                  <Chip
                    label={group.projects.length}
                    size="small"
                    sx={{ height: 20, fontSize: "0.7rem" }}
                  />
                </Box>
              }
              sx={{ textTransform: "none", minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Box>

      <CardContent>
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="body1" fontWeight="medium">
              {currentGroup.projects?.length || 0} Projects
            </Typography>
          </Box>

          <Box display="flex" gap={2} flexWrap="wrap" mb={4}>
            {currentGroup.projects?.map((project) => (
              <Chip
                key={project.id}
                label={project.type.replace(/_/g, " ")}
                onClick={() => handleProjectClick(project)}
                onContextMenu={(e) => handleProjectContextMenu(e, project)}
                icon={getProjectIcon(project.type)}
                color={
                  activeProject && activeProject.id === project.id
                    ? "primary"
                    : "default"
                }
                variant={
                  activeProject && activeProject.id === project.id
                    ? "filled"
                    : "outlined"
                }
                sx={{
                  px: 1,
                  py: 2.5,
                  border: (theme) =>
                    activeProject && activeProject.id === project.id
                      ? `1px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                  "& .MuiChip-label": {
                    px: 1,
                  },
                }}
              />
            ))}
            {(!currentGroup.projects || currentGroup.projects.length === 0) && (
              <Typography variant="body2" color="text.secondary">
                No projects in this group
              </Typography>
            )}
          </Box>
        </>

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
          <MenuItem onClick={closeProjectContextMenu}>Edit</MenuItem>
          <Divider />
          <MenuItem
            onClick={closeProjectContextMenu}
            sx={{ color: "error.main" }}
          >
            Delete
          </MenuItem>
        </Menu>

        {activeProject && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Box
                mb={3}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(activeProject.type),
                      width: 32,
                      height: 32,
                    }}
                  >
                    {getProjectIcon(activeProject.type)}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    {activeProject.type.replace(/_/g, " ")}
                  </Typography>
                </Box>
                <Chip
                  label={activeProject.status || "Active"}
                  color={
                    activeProject.status === "Completed" ? "success" : "primary"
                  }
                  size="small"
                />
              </Box>
              <ProjectDetails
                project={activeProject}
                onUpdate={handleProjectUpdate}
              />
            </Box>
          </>
        )}

        {!activeProject && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={8}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Project Selected
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a project to view details
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadProjects;
