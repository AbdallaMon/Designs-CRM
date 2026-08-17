"use client";

import { useCallback, useEffect, useState } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import {
  FiArrowLeft,
  FiLayers,
  FiMail,
  FiSend,
  FiStar,
} from "react-icons/fi";
import { MdOpenInNew } from "react-icons/md";
import {
  FORM_VALIDATION_MESSAGES as FORM_ERRORS,
  PROFILE_FAMILIES,
  USER_FEEDBACK_MESSAGES as FEEDBACK,
} from "@dms/shared";

import { getData } from "@/app/helpers/functions/getData";
import { usePermission } from "@/app/hooks/usePermission";
import { USER_CODES } from "@/app/helpers/permissionCodes";
import { useAuth } from "@/app/providers/AuthProvider";

import UserPerformance from "@/features/users/UserPerformance";
import FullScreenLoader from "@/shared/components/feedback/loaders/FullscreenLoader";
import LastSeen from "@/shared/components/buttons/LastSeen";
import EditModal from "@/shared/components/models/EditModal";
import UserLogs from "@/features/users/UserLogs.jsx";
import UserRestrictedCountries from "@/features/users/UserRestrictedCountries";
import { ProjectAutoAssignmentDialog } from "@/features/users/ProjectAutoAssignmentDialog";
import Commission from "@/features/accountant/Commission";
import UserProfilesPanel from "@/features/users/UserProfilesPanel";

// Identity fields an admin may edit inline (mirrors the users-list edit form, minus role —
// roles are managed separately via the profiles panel below).
const IDENTITY_INPUTS = [
  {
    data: { id: "name", type: "text", label: "User name", key: "name" },
    pattern: { required: { value: true, message: FORM_ERRORS.ENTER_NAME } },
  },
  {
    data: { id: "email", type: "email", label: "Email" },
    pattern: {
      required: { value: true, message: FORM_ERRORS.ENTER_EMAIL_ADDRESS },
      pattern: {
        value: /\w+@[a-z]+\.[a-z]{2,}/gi,
        message: FORM_ERRORS.INVALID_EMAIL_ADDRESS,
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
];

// Is this a sales-staff user? Restricted-countries / max-leads / deals tools apply only to
// them (same predicate the legacy user-profile page used).
function isStaffUser(user) {
  return heldProfilesOf(user).some(
    (profile) => profile.family === PROFILE_FAMILIES.SALES,
  );
}

// Held profiles as a flat [{ id, key, label }] list from the management row's userProfiles.
function heldProfilesOf(user) {
  return (user?.userProfiles ?? [])
    .map((up) => up.profile ?? up)
    .filter((p) => p && p.id != null);
}

export default function UserDetails({ userId }) {
  const { user: authUser, refetchMe } = useAuth();
  const { hasPermission } = usePermission();
  const canManageProfiles = hasPermission(USER_CODES.MANAGE_PROFILES);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [managingProfiles, setManagingProfiles] = useState(false);

  const fetchUser = useCallback(
    async (isRefetch = false) => {
      if (!isRefetch) setLoading(true);
      const noop = () => {};
      // The held-profiles set (userProfiles) only comes from the management LIST filtered by
      // userId; /profile carries max-leads + edit capability. Merge both.
      const [listRes, profileRes] = await Promise.all([
        getData({
          url: "users",
          setLoading: noop,
          page: 1,
          limit: 1,
          filters: { userId },
          search: "",
          sort: {},
          others: "",
        }),
        getData({ url: `users/${userId}/profile`, setLoading: noop }),
      ]);

      const row = Array.isArray(listRes?.data) ? listRes.data[0] : null;
      const profile =
        profileRes?.data && !Array.isArray(profileRes.data)
          ? profileRes.data
          : null;

      if (!row && !profile) {
        setError(
          listRes?.error?.message ||
            profileRes?.error?.message ||
            FEEDBACK.USER_LOAD_FAILED,
        );
        setUser(null);
        setLoading(false);
        return;
      }

      const merged = { ...(profile || {}), ...(row || {}) };
      merged.userProfiles = row?.userProfiles ?? [];
      merged.canEditProfile =
        profile?.capabilities?.canEditProfile ??
        row?.capabilities?.canEditProfile ??
        false;

      setError(null);
      setUser(merged);
      setLoading(false);
    },
    [userId],
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isSelf =
    authUser?.id != null && Number(authUser.id) === Number(userId);

  const handleProfilesSaved = async () => {
    await fetchUser(true);
    if (isSelf) await refetchMe();
  };

  if (loading) return <FullScreenLoader />;

  if (error) {
    return (
      <Box sx={{ py: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
        <BackToUsers />
        <Card
          elevation={0}
          sx={{ mt: 2, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}
        >
          <CardContent sx={{ py: 5, textAlign: "center" }}>
            <Typography variant="h6" fontWeight={700} color="text.primary">
              Can’t open this user
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {error}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!user) return null;

  const staff = isStaffUser(user);
  const heldProfiles = heldProfilesOf(user);

  return (
    <Box sx={{ py: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      <BackToUsers />

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        sx={{ mt: 1, mb: 2, minHeight: 44, "& .MuiTab-root": { textTransform: "none", fontWeight: 600 } }}
      >
        <Tab label="Overview" />
        <Tab label="Performance" />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={2.5}>
          <IdentityCard user={user} setUser={setUser} />
          <ProfilesCard
            user={user}
            heldProfiles={heldProfiles}
            canManageProfiles={canManageProfiles}
            managingProfiles={managingProfiles}
            setManagingProfiles={setManagingProfiles}
            onSaved={handleProfilesSaved}
            userId={userId}
          />
          <ManagementCard user={user} setUser={setUser} staff={staff} userId={userId} />
        </Stack>
      )}

      {tab === 1 && <UserPerformance user={user} />}
    </Box>
  );
}

function BackToUsers() {
  return (
    <Button
      component="a"
      href="/dashboard/users"
      startIcon={<FiArrowLeft />}
      size="small"
      sx={{ textTransform: "none", color: "text.secondary" }}
    >
      Back to users
    </Button>
  );
}

function IdentityCard({ user, setUser }) {
  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: 26,
                fontWeight: 800,
                bgcolor: (t) => t.palette.primary.main,
                color: "#fff",
              }}
            >
              {user?.name ? user.name[0]?.toUpperCase() : "?"}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h6" fontWeight={800} color="text.primary" noWrap>
                  {user?.name || "Unnamed user"}
                </Typography>
                <Chip
                  size="small"
                  label={user?.isActive ? "Active" : "Banned"}
                  color={user?.isActive ? "success" : "error"}
                  variant={user?.isActive ? "filled" : "outlined"}
                  sx={{ fontWeight: 700, height: 22 }}
                />
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                <FiMail size={14} color="#7a6f63" />
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                  {user?.email || "No email"}
                </Typography>
              </Stack>
              {user?.telegramUsername && (
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                  <FiSend size={13} color="#7a6f63" />
                  <Typography variant="body2" color="text.secondary">
                    {user.telegramUsername}
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>

          {user?.canEditProfile && (
            <EditModal
              editButtonText="Edit details"
              item={user}
              inputs={IDENTITY_INPUTS}
              isObject
              href="users"
              setData={setUser}
              editFormButton="Save"
              renderFormTitle={(u) => `Edit ${u.name || "user"}`}
              extraProps={{ variant: "outlined" }}
            />
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />
        <LastSeen initialLastSeen={user.lastSeenAt} userId={user.id} />
      </CardContent>
    </Card>
  );
}

function ProfilesCard({
  user,
  heldProfiles,
  canManageProfiles,
  managingProfiles,
  setManagingProfiles,
  onSaved,
  userId,
}) {
  const multiple = heldProfiles.length > 1;
  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="overline" fontWeight={700} color="text.secondary">
            Access profiles
          </Typography>
          {canManageProfiles && !managingProfiles && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<FiLayers />}
              onClick={() => setManagingProfiles(true)}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Manage profiles
            </Button>
          )}
        </Stack>

        {heldProfiles.length ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {heldProfiles.map((p) => {
              const active = p.id === user.currentProfileId;
              return (
                <Chip
                  key={p.id}
                  label={p.label ?? p.key}
                  icon={active ? <FiStar size={13} /> : undefined}
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                  sx={{
                    fontWeight: active ? 700 : 600,
                    borderRadius: 1.5,
                    ...(active
                      ? { color: "#fff", "& .MuiChip-icon": { color: "#fff" } }
                      : {}),
                  }}
                />
              );
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No assigned profiles found for this account.
          </Typography>
        )}

        {multiple && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            ★ marks the currently active profile.
          </Typography>
        )}

        {managingProfiles && (
          <UserProfilesPanel
            userId={userId}
            userProfiles={user.userProfiles}
            currentProfileId={user.currentProfileId}
            onSaved={onSaved}
            onClose={() => setManagingProfiles(false)}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ManagementCard({ user, setUser, staff, userId }) {
  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="overline" fontWeight={700} color="text.secondary">
          Management
        </Typography>
        <Box
          sx={{
            mt: 1.5,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* self-gates on user.manage_auto_assignments */}
          <ProjectAutoAssignmentDialog userId={user.id} />
          <Commission userId={user.id} />
          {staff && (
            <>
              <UserRestrictedCountries userId={user.id} />
              <MaxLeadsEditor
                user={user}
                setUser={setUser}
                field="maxLeadsCounts"
                label="Max leads"
                href="users/max-leads"
              />
              <MaxLeadsEditor
                user={user}
                setUser={setUser}
                field="maxLeadCountPerDay"
                label="Max leads / day"
                href="users/max-leads-per-day"
              />
              <Button
                variant="outlined"
                component="a"
                target="_blank"
                href={`/dashboard/deals?staffId=${user.id}`}
                startIcon={<MdOpenInNew />}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                View current deals
              </Button>
            </>
          )}
          <UserLogs staff={user} staffId={userId} />
        </Box>
      </CardContent>
    </Card>
  );
}

function MaxLeadsEditor({ user, setUser, field, label, href }) {
  return (
    <EditModal
      editButtonText={`${label}: ${user[field] ?? 0}`}
      item={user}
      isObject
      href={href}
      setData={setUser}
      editFormButton="Save"
      renderFormTitle={() => `Change ${label.toLowerCase()}`}
      extraProps={{ variant: "outlined" }}
      inputs={[
        {
          data: { id: field, label: "Enter a number", type: "text" },
          pattern: {
            required: { value: true, message: FORM_ERRORS.ENTER_NUMBER },
          },
        },
      ]}
    />
  );
}
