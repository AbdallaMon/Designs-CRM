// Frontend: src/components/ClientProjects/index.tsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
} from "@mui/material";

import { getData } from "@/app/helpers/functions/getData";
import { ProjectDetails } from "./ProjectDetails";
import { PROJECT_TYPES } from "@/app/helpers/constants";

// Main component
export const LeadProjects = ({ clientLeadId }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  useEffect(() => {
    loadProjects();
  }, [clientLeadId]);

  const loadProjects = async () => {
    setLoading(true);

    const projectsReq = await getData({
      url: `shared/projects?clientLeadId=${clientLeadId}&`,
      setLoading,
    });
    if (projectsReq.status === 200) {
      setProjects(projectsReq.data);
    }
  };

  const handleProjectUpdate = (updatedProject) => {
    setProjects(
      projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const handleTabChange = (event, newValue) => {
    setActiveTabIndex(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  const activeProject =
    projects?.find((p) => p.type === PROJECT_TYPES[activeTabIndex]) || null;

  return (
    <Box sx={{ width: "100%" }}>
      <Card>
        <CardHeader
          title="Projects"
          subheader="Manage all projects for this lead"
        />
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={activeTabIndex}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {PROJECT_TYPES.map((type, index) => (
                <Tab
                  key={type}
                  label={type.replace(/_/g, " ")}
                  id={`project-tab-${index}`}
                  aria-controls={`project-tabpanel-${index}`}
                />
              ))}
            </Tabs>
          </Box>

          {activeProject && (
            <Box p={2}>
              <ProjectDetails
                project={activeProject}
                onUpdate={handleProjectUpdate}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LeadProjects;
