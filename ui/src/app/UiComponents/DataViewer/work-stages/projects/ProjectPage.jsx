"use client";

import { useState, useEffect } from "react";
import { ProjectDetails } from "./ProjectDetails";
import { Box, CircularProgress, Alert, Button, Container } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData";

export default function ProjectPage({ id, isStaff }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function fetchProjectData() {
      const res = await getData({
        url: `shared/projects/${id}`,
        setLoading,
      });
      if (res && res.status === 200) {
        setProject(res.data);
      }
    }
    fetchProjectData();
  }, [id]);

  function handleProjectUpdate(updatedProject) {
    setProject((prev) => ({ ...prev, ...updatedProject }));
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="info"
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 2,
            boxShadow: 1,
            fontSize: "1.1rem",
          }}
        >
          This project is not available or you don&apos;t have permission to
          view it.
        </Alert>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button variant="outlined" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <ProjectDetails
        project={project}
        withReleventLinks={true}
        onUpdate={handleProjectUpdate}
        isStaff={isStaff}
      />
    </Container>
  );
}
