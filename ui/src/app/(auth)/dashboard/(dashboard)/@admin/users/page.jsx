"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Switch,
  Typography,
} from "@mui/material";

import React, { useEffect, useState } from "react";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import Link from "next/link";
import CreateModal from "@/app/UiComponents/models/CreateModal.jsx";
import { userRoles, userRolesEnum } from "@/app/helpers/constants";
import { MdAddCircleOutline, MdDelete } from "react-icons/md";
import UserRestrictedCountries from "@/app/UiComponents/DataViewer/UserRestrictedCountries";
import Commission from "@/app/UiComponents/DataViewer/utility/Commission";

const columns = [
  { name: "name", label: "User Name" },
  { name: "email", label: "Email" },
  { name: "telegramUsername", label: "Telegram user name" },

  { name: "role", label: "Main role", type: "enum", enum: userRolesEnum },
  {
    name: "isActive",
    label: "Account status",
    type: "boolean",
    enum: { TRUE: "Active", FALSE: "Banned" },
  },
];

const inputs = [
  {
    data: { id: "name", type: "text", label: "User name", key: "name" },
    pattern: {
      required: {
        value: true,
        message: "Please enter a name",
      },
    },
  },
  {
    data: { id: "email", type: "email", label: "Email" },
    pattern: {
      required: {
        value: true,
        message: "Please enter an email address",
      },
      pattern: {
        value: /\w+@[a-z]+\.[a-z]{2,}/gi,
        message: "Please enter a valid email address",
      },
    },
  },
  {
    data: {
      id: "telegramUsername",
      type: "text",
      label: "Telegram username",
      key: "telegramUsername",
    },
  },
  {
    data: {
      id: "role",
      type: "SelectField",
      label: "Main role",
      options: userRoles,
    },
    pattern: {
      required: {
        value: true,
        message: "Please select a role",
      },
    },
  },
  {
    data: {
      id: "password",
      type: "password",
      label: "Password",
      helperText:
        "The password must contain an uppercase letter, a lowercase letter, a number, and be at least 8 characters long",
    },
    pattern: {
      required: {
        value: true,
        message: "Please enter a password",
      },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        message:
          "The password must contain an uppercase letter, a lowercase letter, a number, and be at least 8 characters long",
      },
    },
  },
];

export default function UsersPage() {
  const {
    data,
    loading,
    setData,
    page,
    setPage,
    limit,
    setLimit,
    total,
    setTotal,
    totalPages,
    setFilters,
  } = useDataFetcher("admin/users", false);
  const { setLoading } = useToastContext();

  async function banAUser(item) {
    const request = await handleRequestSubmit(
      { user: item },
      setLoading,
      `admin/users/${item.id}`,
      false,
      "Banning",
      null,
      "PATCH"
    );
    if (request.status === 200) {
      setData((oldData) =>
        oldData.map((lead) => {
          if (lead.id === item.id) {
            return { ...lead, isActive: !lead.isActive };
          }
          return lead;
        })
      );
    }

    return request;
  }

  async function toggleUserStatus(item, field) {
    const newValue = !item[field];
    const request = await handleRequestSubmit(
      { [field]: newValue },
      setLoading,
      `admin/users/${item.id}/staff-extra`,
      false,
      `Updating ${
        field === "isPrimary" ? "Primary Status" : "Super Sales Status"
      }`,
      null,
      "PATCH"
    );

    if (request.status === 200) {
      setData((oldData) =>
        oldData.map((user) => {
          if (user.id === item.id) {
            return { ...user, [field]: newValue };
          }
          return user;
        })
      );
    }

    return request;
  }

  const editInputs = [...inputs];
  console.log(editInputs, "editInputs");
  console.log(data, "data");

  editInputs.map((input) => {
    if (input.data.id === "password") {
      input.pattern = {};
    }
    return input;
  });

  return (
    <div>
      <AdminTable
        data={data}
        columns={columns}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        total={total}
        setTotal={setTotal}
        totalPages={totalPages}
        setData={setData}
        inputs={inputs}
        loading={loading}
        withEdit={true}
        editHref={"admin/users"}
        extraComponent={({ item }) => (
          <>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {(item.role === "STAFF" ||
                item.subRoles?.some((r) => r.subRole === "STAFF")) && (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={item.isPrimary || false}
                        onChange={() => toggleUserStatus(item, "isPrimary")}
                        size="small"
                      />
                    }
                    label="Primary"
                    labelPlacement="top"
                    sx={{ margin: 0 }}
                  />

                  {/* Super Sales Status Switch */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={item.isSuperSales || false}
                        onChange={() => toggleUserStatus(item, "isSuperSales")}
                        size="small"
                      />
                    }
                    label="Super Sales"
                    labelPlacement="top"
                    sx={{ margin: 0 }}
                  />
                </>
              )}

              <ConfirmWithActionModel
                title={
                  item.isActive
                    ? "Are you sure you want to ban this user?"
                    : "Are you sure you want to unban this user?"
                }
                handleConfirm={() => banAUser(item)}
                isDelete={item.isActive}
                label={item.isActive ? "Ban User" : "Unban User"}
              />
              <RoleManagerDialog
                role={item.role}
                setData={setData}
                subRoles={item.subRoles?.map((r) => r.subRole)}
                userId={item.id}
              />
              <Button
                component={Link}
                href={`/dashboard/users/${item.id}?role=${item.role}&`}
              >
                View Details
              </Button>
              <UserRestrictedCountries userId={item.id} />
              <Commission userId={item.id} />
            </Box>
          </>
        )}
      >
        <Box
          display="flex"
          width="100%"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          flexDirection={{ xs: "column-reverse", md: "row" }}
        >
          <Box
            display="flex"
            gap={2}
            flexWrap="wrap"
            alignItems="center"
            flex={1}
          >
            <Box sx={{ width: { xs: "100%", md: "fit-content" } }}>
              <SearchComponent
                apiEndpoint="search?model=user"
                setFilters={setFilters}
                inputLabel="Search by name or email"
                renderKeys={["name", "email"]}
                mainKey="name"
                searchKey={"userId"}
                withParamsChange={true}
              />
            </Box>
            <div>
              <CreateModal
                label={"Create new user"}
                inputs={editInputs}
                href={"admin/users"}
                setData={setData}
                extraProps={{
                  formTitle: "New user",
                  btnText: "Create",
                  variant: "outlined",
                }}
              />
            </div>
          </Box>
        </Box>
      </AdminTable>
    </div>
  );
}

const roleIcons = {
  STAFF: "👷",
  THREE_D_DESIGNER: "🎨",
  TWO_D_DESIGNER: "🖌",
  ACCOUNTANT: "💰",
  SUPER_ADMIN: "🛡",
  TWO_D_EXECUTOR: "🖌",
};

export const RoleManagerDialog = ({ role, subRoles, setData, userId }) => {
  const allRoles = Object.keys(roleIcons); // Available roles
  const [open, setOpen] = useState(false);
  const [selectedSubRoles, setSelectedSubRoles] = useState([...subRoles]); // SubRoles state
  const [tempRole, setTempRole] = useState(""); // Temp role to add
  const { setLoading } = useToastContext();
  function onClose() {
    setOpen(false);
  }
  async function onSave(updatedRoles) {
    const request = await handleRequestSubmit(
      updatedRoles,
      setLoading,
      `admin/users/${userId}/roles`,
      false,
      "Updating roles",
      null,
      "PUT"
    );
    if (request.status === 200) {
      window.location.reload();
      onClose();
    }
  }
  useEffect(() => {
    setSelectedSubRoles([...subRoles]); // Sync when props change
  }, [subRoles]);

  // Add a new role if not already in the list
  const handleAddRole = () => {
    if (tempRole && !selectedSubRoles.includes(tempRole)) {
      setSelectedSubRoles([...selectedSubRoles, tempRole]);
      setTempRole(""); // Reset selection
    }
  };

  // Remove role from subRoles list
  const handleRemoveRole = (roleToRemove) => {
    setSelectedSubRoles(selectedSubRoles.filter((r) => r !== roleToRemove));
  };

  // Save changes and send to API
  const handleSave = () => {
    const updatedRoles = {
      added: selectedSubRoles.filter((r) => !subRoles.includes(r)), // New roles
      removed: subRoles.filter((r) => !selectedSubRoles.includes(r)), // Deleted roles
    };
    onSave(updatedRoles);
  };
  if (!open) return <Button onClick={() => setOpen(true)}>Manage Roles</Button>;
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage User Roles</DialogTitle>
      <DialogContent>
        <Typography variant="h6">Main Role:</Typography>
        <List>
          <ListItem>
            <ListItemIcon>{roleIcons[role]}</ListItemIcon>
            <ListItemText primary={role} />
          </ListItem>
        </List>

        <Typography variant="h6">Sub Roles:</Typography>
        <List>
          {selectedSubRoles.length > 0 ? (
            selectedSubRoles.map((r) => (
              <ListItem key={r}>
                <ListItemIcon>{roleIcons[r]}</ListItemIcon>
                <ListItemText primary={r} />
                <IconButton onClick={() => handleRemoveRole(r)} color="error">
                  <MdDelete />
                </IconButton>
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No sub-roles assigned.
            </Typography>
          )}
        </List>

        <FormControl fullWidth margin="normal">
          <InputLabel>Add Sub-Role</InputLabel>
          <Select
            value={tempRole}
            onChange={(e) => setTempRole(e.target.value)}
          >
            {allRoles
              .filter((r) => r !== role && !selectedSubRoles.includes(r)) // Exclude main role & already selected ones
              .map((r) => (
                <MenuItem key={r} value={r}>
                  {roleIcons[r]} {r}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<MdAddCircleOutline />}
          onClick={handleAddRole}
          fullWidth
          disabled={!tempRole}
        >
          Add Role
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
