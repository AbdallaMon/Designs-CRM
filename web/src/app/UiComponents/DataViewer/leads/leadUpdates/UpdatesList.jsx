import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Paper,
  Container,
} from "@mui/material";

import { DEPARTMENTS } from "@/app/helpers/constants";
import { getData } from "@/app/helpers/functions/getData";
import { UpdateCard } from "./UpdateCard";
import { CreateUpdateModal } from "./CreateUpdate";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";

// Main Updates List Component
const UpdatesList = ({ clientLeadId, currentUserDepartment = "STAFF" }) => {
  const [updates, setUpdates] = useState([]);
  const [filter, setFilter] = useState("notArchived");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  async function getInitialData() {
    const clientLeadUpdates = await getData({
      url: `shared/updates/${clientLeadId}?type=${currentUserDepartment}&department=${departmentFilter}&`,
      setLoading,
    });
    if (clientLeadUpdates && clientLeadUpdates.status === 200) {
      setUpdates(clientLeadUpdates.data);
    }
  }
  useEffect(() => {
    if (clientLeadId) {
      getInitialData();
    }
  }, [clientLeadId, departmentFilter]);

  const handleCreateUpdate = (updateData) => {
    // setUpdates((prev) => [updateData, ...prev]);
    getInitialData();
  };

  const handleToggleArchive = (newUpdate) => {
    // todo
    setUpdates((prev) =>
      prev.map((update) => (update.id === newUpdate.id ? newUpdate : update))
    );
  };
  function onUpdate(newUpdate) {
    getInitialData();
    // setUpdates((oldUpdates) =>
    //   oldUpdates.map((up) => {
    //     if (up.id === newUpdate.id) {
    //       return newUpdate;
    //     } else {
    //       return up;
    //     }
    //   })
    // );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading updates...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Updates
        </Typography>
        <CreateUpdateModal
          onCreate={handleCreateUpdate}
          clientLeadId={clientLeadId}
          currentUserDepartment={currentUserDepartment}
        />
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <Stack direction="row" spacing={1}>
            {[
              { value: "all", label: "All types" },
              { value: "notArchived", label: "Active" },
              { value: "archived", label: "Archived" },
            ].map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "contained" : "outlined"}
                onClick={() => setFilter(option.value)}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                {option.label}
              </Button>
            ))}
          </Stack>

          {isAdmin && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Department</InputLabel>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                label="Filter by Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {DEPARTMENTS.map((dept) => (
                  <MenuItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Paper>

      <Box>
        {updates?.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary">
              No updates found
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {filter === "archived"
                ? "No archived updates to display"
                : filter === "notArchived"
                ? "No active updates to display"
                : "No updates match your current filters"}
            </Typography>
          </Paper>
        ) : (
          updates?.map((update) => {
            const canManageDepartments =
              update.createdById === user?.id || isAdmin;
            const userSharedUpdate = update.sharedSettings.find(
              (shared) => shared.type === currentUserDepartment
            );
            const adminSharedUpdate = isAdmin
              ? update.sharedSettings.find((shared) => shared.type === "ADMIN")
              : null;
            const isArchived = canManageDepartments
              ? adminSharedUpdate
                ? adminSharedUpdate.isArchived
                : update.sharedSettings
                    .filter((shared) => shared.type !== update.department)
                    .every((shared) => shared.isArchived)
              : userSharedUpdate.isArchived;

            if (filter === "archived" && !isArchived) {
              return;
            } else if (filter === "notArchived" && isArchived) {
              return;
            } else {
              return (
                <UpdateCard
                  key={update.id}
                  update={update}
                  onToggleArchive={handleToggleArchive}
                  currentUserDepartment={currentUserDepartment}
                  filter={filter}
                  onUpdate={onUpdate}
                />
              );
            }
          })
        )}
      </Box>
    </Container>
  );
};

export default UpdatesList;
