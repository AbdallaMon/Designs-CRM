import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";
import { MdUpdate } from "react-icons/md";

import { DEPARTMENTS } from "@/app/helpers/constants";
import { getData } from "@/app/helpers/functions/getData";
import { UpdateCard } from "@/features/leads/leadUpdates/UpdateCard.jsx";
import { CreateUpdateModal } from "@/features/leads/leadUpdates/CreateUpdate.jsx";
import { useAuth } from "@/app/providers/AuthProvider";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { TabSection } from "@/features/leads/shared/tabKit.jsx";
import { TabLoading } from "@/features/leads/shared/TabLoading.jsx";
import { EmptyState } from "@/features/leads/shared/EmptyState.jsx";

// Main Updates List Component
const UpdatesList = ({ clientLeadId, currentUserDepartment = "STAFF" }) => {
  const [updates, setUpdates] = useState([]);
  const [filter, setFilter] = useState("notArchived");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { user } = useAuth();
  const isAdmin = checkIfAdmin(user);
  async function getInitialData() {
    setError(false);
    const clientLeadUpdates = await getData({
      url: `shared/updates/${clientLeadId}?type=${currentUserDepartment}&department=${departmentFilter}&`,
      setLoading,
    });
    if (clientLeadUpdates && clientLeadUpdates.status === 200) {
      setUpdates(clientLeadUpdates.data);
    } else {
      setError(true);
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
    return <TabLoading />;
  }

  if (error) {
    return (
      <TabSection icon={<MdUpdate />} title="Updates">
        <EmptyState
          icon={<MdUpdate />}
          title="Failed to load updates"
          description="An error occurred while fetching the updates. Please try again."
          action={
            <Button
              variant="outlined"
              onClick={getInitialData}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              Retry
            </Button>
          }
        />
      </TabSection>
    );
  }

  return (
    <TabSection
      icon={<MdUpdate />}
      title="Updates"
      count={updates?.length || 0}
      action={
        <CreateUpdateModal
          onCreate={handleCreateUpdate}
          clientLeadId={clientLeadId}
          currentUserDepartment={currentUserDepartment}
        />
      }
    >
      {/* Filter bar */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
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

      <Box>
        {updates?.length === 0 ? (
          <EmptyState
            icon={<MdUpdate />}
            title="No updates found"
            description={
              filter === "archived"
                ? "No archived updates to display"
                : filter === "notArchived"
                ? "No active updates to display"
                : "No updates match your current filters"
            }
          />
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
    </TabSection>
  );
};

export default UpdatesList;
