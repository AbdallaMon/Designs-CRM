// src/app/components/ProjectsList.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  Tooltip,
  Paper,
  Stack,
  Avatar,
  Button,
} from "@mui/material";
import { MdAssignment, MdPriorityHigh, MdBusinessCenter } from "react-icons/md";

import { ProjectDetails } from "../../work-stages/projects/ProjectDetails";
import { getData } from "@/app/helpers/functions/getData";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent";
import { statusColors } from "@/app/helpers/constants";
import PaginationWithLimit from "../../PaginationWithLimit";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import FullScreenLoader from "@/app/UiComponents/feedback/loaders/FullscreenLoader";

export const ProjectsList = ({ userId }) => {
  const {
    data: projects,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    filters,
    setFilters,
    setRender,
  } = useDataFetcher(`shared/projects/user-profile/${userId}?&`, false);
  const handleProjectUpdate = (updatedProject) => {
    setRender((prev) => !prev);
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          User Projects
        </Typography>
        <ProjectFilters filters={filters} setFilters={setFilters} />
      </Paper>
      {loading && <FullScreenLoader />}
      {(!projects || projects?.lenght === 0) && (
        <Box textAlign="center" py={8}>
          <Typography variant="h5">No projects found</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
            You don&apos;t have any assigned projects at the moment.
          </Typography>
        </Box>
      )}
      <Grid container spacing={3}>
        {projects?.map((project) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={project.id}>
            <Card
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  boxShadow: 6,
                },
              }}
            >
              <CardHeader
                sx={{ pb: 1 }}
                title={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6">{`Project #${project.id}`}</Typography>
                    <Chip
                      label={project.status}
                      color={statusColors[project.status] || "default"}
                      size="small"
                    />
                  </Box>
                }
                subheader={
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {project.type.replace(/_/g, " ").toLowerCase()}
                  </Typography>
                }
              />

              <CardContent sx={{ pt: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Tooltip title={`Priority: ${project.priority}`}>
                    <Chip
                      icon={<MdPriorityHigh />}
                      label={project.priority.replace(/_/g, " ")}
                      size="small"
                      color={
                        project.priority.includes("HIGH")
                          ? "error"
                          : project.priority.includes("MEDIUM")
                          ? "warning"
                          : "success"
                      }
                      variant="outlined"
                    />
                  </Tooltip>
                </Stack>

                {project.clientLead && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <MdBusinessCenter size={20} color="#666" />
                      <Typography variant="subtitle2" sx={{ ml: 1 }}>
                        Client Details
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      <strong>#</strong>{" "}
                      {project.clientLead.id || "Not specified"}
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {project.clientLead.client?.name || "Not specified"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.8rem" }}
                    >
                      {project.clientLead.client?.email || "No email"}
                    </Typography>

                    {project.clientLead.averagePrice && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 1, fontWeight: "medium" }}
                      >
                        Price: {project.clientLead.averagePrice} AED
                      </Typography>
                    )}
                  </>
                )}
              </CardContent>

              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderTop: "1px solid",
                  borderColor: "divider",
                }}
              >
                <ProjectDetails
                  project={project}
                  onUpdate={handleProjectUpdate}
                  isStaff={false}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
      <PaginationWithLimit
        total={total}
        limit={limit}
        page={page}
        setLimit={setLimit}
        setPage={setPage}
        totalPages={totalPages}
      />
    </Box>
  );
};

function ProjectFilters({ filters, setFilters }) {
  return (
    <Box display="flex" gap={2} alignItems="center">
      <SearchComponent
        apiEndpoint="search?model=clientLead"
        setFilters={setFilters}
        inputLabel="Search lead by id, name or phone"
        renderKeys={["id", "client.name", "client.phone", "client.email"]}
        mainKey="id"
        searchKey={"leadId"}
        withParamsChange={false}
      />
    </Box>
  );
}
