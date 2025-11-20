"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {
  Badge,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  lighten,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import React, { useEffect, useState } from "react";
import SearchComponent from "@/app/UiComponents/formComponents/SearchComponent.jsx";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit.js";
import { useToastContext } from "@/app/providers/ToastLoadingProvider.js";
import ConfirmWithActionModel from "@/app/UiComponents/models/ConfirmsWithActionModel.jsx";
import Link from "next/link";
import CreateModal from "@/app/UiComponents/models/CreateModal.jsx";
import {
  roleIcons,
  userRoles,
  userRolesEnum,
  usersColors,
  usersColorsArray,
  usersHexColors,
} from "@/app/helpers/constants";
import {
  MdAddCircleOutline,
  MdDelete,
  MdMoreHoriz,
  MdVisibility,
} from "react-icons/md";
import UserRestrictedCountries from "@/app/UiComponents/DataViewer/users/UserRestrictedCountries";
import Commission from "@/app/UiComponents/DataViewer/utility/Commission";
import { NotesComponent } from "@/app/UiComponents/DataViewer/utility/Notes";
import { RoleManagerDialog } from "../DataViewer/users/RoleManagerDialog";
import { ProjectAutoAssignmentDialog } from "../DataViewer/users/ProjectAutoAssignmentDialog";

const columns = [
  { name: "name", label: "User Name" },
  { name: "email", label: "Email" },
  { name: "telegramUsername", label: "Telegram user name" },

  {
    name: "role",
    label: "Main role",
    type: "enum",
    enum: userRolesEnum,
    type: "function",
    render: (item) => {
      const color = item.isActive
        ? item.role === "STAFF"
          ? item.isSuperSales
            ? usersHexColors.isSuperSales
            : item.isPrimary
            ? usersHexColors.isPrimary
            : usersHexColors[item.role]
          : usersHexColors[item.role]
        : usersHexColors.banned;
      const role =
        item.role === "STAFF"
          ? item.isSuperSales
            ? "SUPER_SALES"
            : item.isPrimary
            ? "PRIMARY_SALES"
            : item.role
          : item.role;
      return (
        <Badge
          variant="dot"
          sx={{
            color: color,
            backgroundColor: lighten(color, 0.6),
            px: 2,
            py: 1,
            borderRadius: 1,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "fit-content",
          }}
        >
          {roleIcons[role]} {item.isActive ? role : `${role} (BANNED)`}
        </Badge>
      );
    },
  },
  // {
  //   name: "isActive",
  //   label: "Account status",
  //   type: "boolean",
  //   enum: { TRUE: "Active", FALSE: "Banned" },
  // },
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
  editInputs.map((input) => {
    if (input.data.id === "password") {
      input.pattern = {};
    }
    return input;
  });
  return (
    <div>
      <Container maxWidth="lg">
        <Box sx={{ pt: 5 }}>
          <Typography variant="h5" fontWeight="bold" mb={2}>
            Users Type Colors Legend{" "}
          </Typography>
          <Box
            mb={2}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1.5,
              width: "fit-content",
              flexWrap: "wrap",
              alignContent: "center",
            }}
          >
            {usersColorsArray.map((color, index) => (
              <Box
                key={index}
                variant="dot"
                sx={{
                  color: color,
                  backgroundColor: lighten(color, 0.6),
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: 12,
                }}
              >
                {usersColors[color]}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
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
        rowSx={(user) => {
          return {
            backgroundColor: lighten(
              user.isActive
                ? user.role === "STAFF"
                  ? user.isSuperSales
                    ? usersHexColors.isSuperSales
                    : user.isPrimary
                    ? usersHexColors.isPrimary
                    : usersHexColors[user.role]
                  : usersHexColors[user.role]
                : usersHexColors.banned,
              0.95
            ),
          };
        }}
        editHref={"admin/users"}
        extraComponent={({ item }) => (
          <UserRowActions
            item={item}
            setData={setData}
            toggleUserStatus={toggleUserStatus}
            banAUser={banAUser}
          />
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

function UserRowActions({ item, setData, toggleUserStatus, banAUser }) {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const isStaff =
    item.role === "STAFF" || item.subRoles?.some((r) => r.subRole === "STAFF");

  const InlinePrimary = (
    <Box
      display={"flex"}
      flexDirection="row-reverse"
      gap={1}
      alignItems={"center"}
    >
      {isStaff && (
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
            sx={{ m: 0 }}
          />
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
            sx={{ m: 0 }}
          />
        </>
      )}

      <Button
        component={Link}
        href={`/dashboard/users/${item.id}?role=${item.role}&`}
        size="small"
        variant="outlined"
        startIcon={<MdVisibility />}
        sx={{ whiteSpace: "nowrap" }}
      >
        View
      </Button>
    </Box>
  );

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      flexWrap="wrap"
      sx={{
        minWidth: 220,
        maxWidth: 520,
      }}
    >
      {/* Inline essentials on md+, or hide on small screens */}

      {/* More menu (contains heavier controls and everything on small screens) */}
      <Tooltip title="More actions">
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MdMoreHoriz />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 260, p: 1 } }}
      >
        {/* On small screens, also show the primary inline controls inside the menu */}
        {smDown && (
          <Box sx={{ px: 1, pb: 1, display: "grid", gap: 1 }}>
            {InlinePrimary}
          </Box>
        )}

        {/* Your existing components render their own buttons; put them inside the menu nicely */}
        <Box sx={{ px: 1, py: 0.5 }}>
          <ConfirmWithActionModel
            title={
              item.isActive
                ? "Are you sure you want to ban this user?"
                : "Are you sure you want to unban this user?"
            }
            handleConfirm={async () => {
              await banAUser(item);
              setAnchorEl(null);
            }}
            isDelete={item.isActive}
            label={item.isActive ? "Ban User" : "Unban User"}
            fullWidth={true}
          />
        </Box>

        <Box sx={{ px: 1, py: 0.5 }}>
          <RoleManagerDialog
            role={item.role}
            setData={setData}
            subRoles={item.subRoles?.map((r) => r.subRole)}
            userId={item.id}
          />
        </Box>
        <Box sx={{ px: 1, py: 0.5 }}>
          <ProjectAutoAssignmentDialog userId={item.id} />
        </Box>
        <Box sx={{ px: 1, py: 0.5 }}>
          <UserRestrictedCountries userId={item.id} />
        </Box>

        <Box sx={{ px: 1, py: 0.5 }}>
          <Commission userId={item.id} />
        </Box>

        <Box sx={{ px: 1, py: 0.5 }}>
          <NotesComponent
            id={item.id}
            idKey="notedUserId"
            slug="shared"
            fullWidth={true}
          />
        </Box>
      </Menu>
      {!smDown && (
        <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap" }}>
          {InlinePrimary}
        </Box>
      )}
    </Stack>
  );
}
