"use client";
import useDataFetcher from "@/app/helpers/hooks/useDataFetcher";
import AdminTable from "@/app/UiComponents/DataViewer/AdminTable";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Divider,
  FormControlLabel,
  IconButton,
  InputLabel,
  lighten,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import React from "react";
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
  MdExpandMore,
} from "react-icons/md";
import { FiUsers } from "react-icons/fi";
import UserRestrictedCountries from "@/app/UiComponents/DataViewer/users/UserRestrictedCountries";
import Commission from "@/app/UiComponents/DataViewer/utility/Commission";
import { ProfileManagerDialog } from "../DataViewer/users/ProfileManagerDialog";
import { ProjectAutoAssignmentDialog } from "../DataViewer/users/ProjectAutoAssignmentDialog";

// Mirrors `packages/shared/constants/access/profiles.js` PROFILE_META (web has no
// dependency on @dms/shared, so the { value, label } options are kept in sync here).
const PROFILE_OPTIONS = [
  { value: "NORMAL_SALES", label: "موظف مبيعات" },
  { value: "PRIMARY_SALES", label: "مبيعات أساسي" },
  { value: "SUPER_SALES", label: "سوبر سيلز" },
  { value: "SUPER_SALES_BASE", label: "سوبر سيلز (أساسي)" },
  { value: "ADMIN", label: "مدير" },
  { value: "SUPER_ADMIN", label: "مدير أعلى" },
  { value: "ACCOUNTANT", label: "محاسب" },
  { value: "DESIGNER_3D", label: "مصمم 3D" },
  { value: "DESIGNER_2D", label: "مصمم 2D" },
  { value: "EXECUTOR_2D", label: "منفّذ 2D" },
  { value: "CONTACT_INITIATOR", label: "مبادر تواصل" },
];

const PROFILE_LABEL = Object.fromEntries(PROFILE_OPTIONS.map((p) => [p.value, p.label]));

// The user's assigned profiles (from admin/users MANAGEMENT_SELECT userProfiles).
function assignedProfiles(item) {
  const ups = Array.isArray(item.userProfiles) ? item.userProfiles : [];
  return ups.map((up) => up.profile).filter(Boolean);
}

// The label of the user's ACTIVE profile (falls back to the legacy profile string).
function currentProfileName(item) {
  const current = assignedProfiles(item).find((p) => p?.id === item.currentProfileId);
  if (current) return current.label || PROFILE_LABEL[current.key] || current.key;
  return PROFILE_LABEL[item.profile] || item.profile || "—";
}

// A stable color for a user row, keyed off the (legacy) base role which the backend
// keeps in sync with the current profile. No more isPrimary/isSuperSales branching.
function userColor(item) {
  if (!item.isActive) return usersHexColors.banned;
  return usersHexColors[item.role] || usersHexColors.default || "#6b7280";
}

const columns = [
  {
    name: "name",
    label: "المستخدم",
    type: "function",
    render: (item) => {
      const safeColor = userColor(item);
      return (
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              bgcolor: safeColor,
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {item.name ? item.name[0]?.toUpperCase() : "؟"}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.primary"
              sx={{ lineHeight: 1.3 }}
              noWrap
            >
              {item.name || "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {item.email || "—"}
            </Typography>
          </Box>
        </Stack>
      );
    },
  },
  {
    name: "telegramUsername",
    label: "معرّف تيليجرام",
    type: "function",
    render: (item) =>
      item.telegramUsername ? (
        <Chip
          size="small"
          label={item.telegramUsername}
          sx={{
            fontWeight: 600,
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.12),
            color: "info.main",
            border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
          }}
        />
      ) : (
        <Typography variant="caption" color="text.disabled">
          —
        </Typography>
      ),
  },

  {
    name: "profile",
    label: "الأدوار",
    type: "function",
    render: (item) => {
      const safeColor = userColor(item);
      const profiles = assignedProfiles(item);
      const currentLabel = currentProfileName(item);
      return (
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          {/* the ACTIVE profile */}
          <Chip
            size="small"
            label={currentLabel}
            sx={{
              fontWeight: 700,
              borderRadius: 1.5,
              color: safeColor,
              bgcolor: lighten(safeColor, 0.85),
              border: `1px solid ${alpha(safeColor, 0.35)}`,
            }}
          />
          {/* other assigned profiles the user can switch to */}
          {profiles
            .filter((p) => p.id !== item.currentProfileId)
            .map((p) => (
              <Chip
                key={p.id}
                size="small"
                variant="outlined"
                label={p.label || PROFILE_LABEL[p.key] || p.key}
                sx={{ fontWeight: 600, borderRadius: 1.5, color: "text.secondary" }}
              />
            ))}
          {!item.isActive && (
            <Chip
              size="small"
              label="محظور"
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                color: usersHexColors.banned,
                bgcolor: alpha(usersHexColors.banned, 0.12),
                border: `1px solid ${alpha(usersHexColors.banned, 0.3)}`,
              }}
            />
          )}
        </Stack>
      );
    },
  },
];

const PASSWORD_RULE =
  "The password must contain an uppercase letter, a lowercase letter, a number, and be at least 8 characters long";

// The create/edit form is IDENTITY only — no role/profile field. Roles are assigned
// separately via the "اسناد دور" (profiles) dialog in the row actions.
const inputs = [
  {
    data: { id: "name", type: "text", label: "User name", key: "name" },
    pattern: {
      required: { value: true, message: "Please enter a name" },
    },
  },
  {
    data: { id: "email", type: "email", label: "Email" },
    pattern: {
      required: { value: true, message: "Please enter an email address" },
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
      id: "password",
      type: "password",
      label: "Password",
      helperText: PASSWORD_RULE,
    },
    pattern: {
      required: { value: true, message: "Please enter a password" },
      pattern: {
        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
        message: PASSWORD_RULE,
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

  const editInputs = [...inputs];
  editInputs.map((input) => {
    if (input.data.id === "password") {
      input.pattern = {};
    }
    return input;
  });
  return (
    <div>
      <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 } }}>
        <UsersPageHeader />
        <UsersLegend />
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
        rowSx={(user) => ({
          backgroundColor: lighten(userColor(user), 0.95),
        })}
        editHref={"admin/users"}
        extraComponent={({ item }) => (
          <UserRowActions item={item} setData={setData} banAUser={banAUser} />
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
            sx={{
              width: { xs: "100%", md: 340 },
              maxWidth: "100%",
            }}
          >
            <SearchComponent
              apiEndpoint="search?model=all-users"
              setFilters={setFilters}
              inputLabel="ابحث بالاسم أو البريد الإلكتروني"
              renderKeys={["name", "email"]}
              mainKey="name"
              searchKey={"userId"}
              withParamsChange={true}
            />
          </Box>
          <Box sx={{ width: { xs: "100%", md: "auto" } }}>
            <CreateModal
              label={"إضافة مستخدم"}
              inputs={editInputs}
              href={"admin/users"}
              setData={setData}
              extraProps={{
                formTitle: "مستخدم جديد",
                btnText: "إنشاء",
                variant: "contained",
              }}
            />
          </Box>
        </Box>
      </AdminTable>
    </div>
  );
}

function UserRowActions({ item, setData, banAUser }) {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const ViewButton = (
    <Button
      component={Link}
      href={`/dashboard/users/${item.id}?role=${item.role}&`}
      size="small"
      variant="outlined"
      startIcon={<MdVisibility />}
      sx={{ whiteSpace: "nowrap", borderRadius: 2, fontWeight: 600 }}
    >
      عرض
    </Button>
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
      <Tooltip title="إجراءات إضافية">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            border: (t) => `1px solid ${t.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <MdMoreHoriz />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 280, p: 1, borderRadius: 3 } }}
      >
        <Typography
          variant="overline"
          sx={{
            px: 1.5,
            py: 0.5,
            display: "block",
            fontWeight: 700,
            color: "text.secondary",
          }}
        >
          إدارة المستخدم
        </Typography>
        <Divider sx={{ mb: 0.5 }} />
        {/* On small screens, show the view button inside the menu */}
        {smDown && (
          <Box sx={{ px: 1, pb: 1, display: "grid", gap: 1 }}>
            {ViewButton}
          </Box>
        )}

        {/* Your existing components render their own buttons; put them inside the menu nicely */}
        <Box sx={{ px: 1, py: 0.5 }}>
          <ConfirmWithActionModel
            title={
              item.isActive
                ? "هل أنت متأكد من حظر هذا المستخدم؟"
                : "هل أنت متأكد من إلغاء حظر هذا المستخدم؟"
            }
            handleConfirm={async () => {
              await banAUser(item);
              setAnchorEl(null);
            }}
            isDelete={item.isActive}
            label={item.isActive ? "حظر المستخدم" : "إلغاء الحظر"}
            fullWidth={true}
          />
        </Box>

        <Box sx={{ px: 1, py: 0.5 }}>
          <ProfileManagerDialog
            userId={item.id}
            userProfiles={item.userProfiles}
            currentProfileId={item.currentProfileId}
            setData={setData}
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
      </Menu>
      {!smDown && (
        <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap" }}>
          {ViewButton}
        </Box>
      )}
    </Stack>
  );
}

function UsersPageHeader() {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.08
        )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        p: { xs: 2.5, md: 3 },
        mb: 2.5,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            color: theme.palette.primary.main,
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          <FiUsers />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            المستخدمون
          </Typography>
          <Typography variant="body2" color="text.secondary">
            إدارة حسابات الفريق وأدوارهم وصلاحياتهم
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function UsersLegend() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
        mb: 2,
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((v) => !v)}
        role="button"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: 2,
          py: 1.25,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          دليل ألوان أنواع المستخدمين
        </Typography>
        <MdExpandMore
          style={{
            transition: "transform .2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            fontSize: 20,
          }}
        />
      </Box>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Divider />
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            p: 2,
          }}
        >
          {usersColorsArray.map((color, index) => {
            const safe = color || "#6b7280";
            return (
              <Chip
                key={index}
                size="small"
                label={usersColors[color]}
                sx={{
                  fontWeight: 700,
                  borderRadius: 1.5,
                  color: safe,
                  bgcolor: lighten(safe, 0.85),
                  border: `1px solid ${alpha(safe, 0.35)}`,
                }}
              />
            );
          })}
        </Box>
      </Collapse>
    </Paper>
  );
}
