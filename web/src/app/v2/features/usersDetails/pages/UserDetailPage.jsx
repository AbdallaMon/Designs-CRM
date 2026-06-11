"use client";

// User detail / editor page — collapses the legacy admin user-profile + the self-profile views
// into ONE permission-gated, URL-tabbed feature (mirrors LeadDetailsPage). The tab SET is
// filtered by permission CODE (the same predicate that gates each tab's content); a non-admin
// viewing their OWN profile holds only profile.view/edit, so they see ONLY the Profile tab —
// the PartialPermission pattern. The active tab lives in ?tab= via <UrlTabs>; each panel mounts
// only when active (lazy per-tab fetching). Header + Profile read come from getProfile (object-
// scope-checked self-or-admin, returns capabilities.canEditProfile).
//
// CAPABILITY NOTE: the per-record management capabilities.* live on the LIST rows; a deep-linked
// detail has only the profile's canEditProfile. So the management tabs derive a deep-link-safe
// capability object that MIRRORS the BE dto (computeUserCapabilities): code-holder, and
// not-self for the status toggle. The server remains the source of truth.

import { useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import {
  PageHeader,
  UrlTabs,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/app/v2/shared/components";
import { usersMessages } from "@/app/v2/features/users/config/usersMessages.js";
import { useUserDetail } from "../hooks/useUserDetail.js";
import { ProfileTab } from "../components/tabs/ProfileTab.jsx";
import { AccountTab } from "../components/tabs/AccountTab.jsx";
import { RolesTab } from "../components/tabs/RolesTab.jsx";
import { AutoAssignmentsTab } from "../components/tabs/AutoAssignmentsTab.jsx";
import { SettingsTab } from "../components/tabs/SettingsTab.jsx";
import { ActivityTab } from "../components/tabs/ActivityTab.jsx";
import { CommissionsView } from "@/app/v2/features/adminResidual/components/CommissionsView.jsx";

const P = PERMISSIONS.USER;
const RESIDUAL = PERMISSIONS.ADMIN_RESIDUAL;

export function UserDetailPage({ userId }) {
  const { hasPermission, hasAnyPermission } = usePermission();
  const { user: authUser } = useAuth();

  // The page is reachable for anyone who can view a profile (self) OR manage users (admin).
  const canViewProfile = hasPermission(P.PROFILE_VIEW);
  const canList = hasPermission(P.LIST);
  const canEnter = canViewProfile || canList;

  const { profile, isLoading, error, refetch } = useUserDetail(userId, { autoFetch: canEnter });

  const isSelf = profile?.id != null && Number(profile.id) === Number(authUser?.id);

  // Deep-link-safe management capabilities mirroring the BE dto (computeUserCapabilities).
  const manageCaps = useMemo(
    () => ({
      canEditUser: hasPermission(P.UPDATE),
      canChangeRoles: hasPermission(P.MANAGE_ROLES),
      canSetMaxLeads: hasPermission(P.SET_MAX_LEADS),
      canManageRestrictedCountries: hasPermission(P.MANAGE_RESTRICTED_COUNTRIES),
      canManageAutoAssignments: hasPermission(P.MANAGE_AUTO_ASSIGNMENTS),
      canManageStaffExtra: hasPermission(P.MANAGE_STAFF_EXTRA),
      canToggleStatus: hasPermission(P.UPDATE) && !isSelf,
    }),
    // hasPermission is stable per render; isSelf is the meaningful dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSelf],
  );

  // Permission-filtered tab set (same predicate gates the tab's content).
  const tabs = useMemo(() => {
    const t = [{ key: "profile", label: "الملف الشخصي" }];
    if (hasPermission(P.UPDATE)) t.push({ key: "account", label: "الحساب" });
    if (hasPermission(P.MANAGE_ROLES)) t.push({ key: "roles", label: "الأدوار" });
    if (hasPermission(P.MANAGE_AUTO_ASSIGNMENTS))
      t.push({ key: "assignments", label: "التعيينات التلقائية" });
    if (
      hasAnyPermission([P.MANAGE_RESTRICTED_COUNTRIES, P.SET_MAX_LEADS, P.MANAGE_STAFF_EXTRA])
    )
      t.push({ key: "settings", label: "الإعدادات" });
    if (hasAnyPermission([P.VIEW_LOGS, P.VIEW_LAST_SEEN]))
      t.push({ key: "activity", label: "النشاط" });
    if (hasPermission(RESIDUAL.COMMISSION_VIEW))
      t.push({ key: "commissions", label: "العمولات" });
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A self-only viewer (no admin codes) sees just Profile — surface that as the partial-perm
  // experience (a calm single-tab profile, never a 403).
  const profileOnly = tabs.length === 1;

  if (!canEnter) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <EmptyState
          title="هذا المستخدم غير متاح لصلاحياتك"
          description="لا تملك صلاحية عرض هذا الملف."
        />
      </Container>
    );
  }

  const headerTitle = profile?.name ? `${profile.name}` : "ملف المستخدم";

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title={headerTitle}
        subtitle={profile?.email}
        breadcrumbs={
          canList
            ? [
                { label: "الإدارة" },
                { label: "المستخدمون", href: "/v2/users" },
                { label: headerTitle },
              ]
            : [{ label: "الملف الشخصي" }]
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={usersMessages} />
      ) : isLoading && !profile ? (
        <LoadingState variant="detail" />
      ) : !profile ? (
        <EmptyState title="الملف غير موجود" />
      ) : profileOnly ? (
        <Box>
          <ProfileTab profile={profile} onUpdated={refetch} />
        </Box>
      ) : (
        <UrlTabs tabs={tabs}>
          {(active) => (
            <Box sx={{ minHeight: 320 }}>
              {active === "profile" && <ProfileTab profile={profile} onUpdated={refetch} />}
              {active === "account" && (
                <AccountTab user={profile} capabilities={manageCaps} onUpdated={refetch} />
              )}
              {active === "roles" && (
                <RolesTab profile={profile} capabilities={manageCaps} onUpdated={refetch} />
              )}
              {active === "assignments" && (
                <AutoAssignmentsTab userId={userId} capabilities={manageCaps} />
              )}
              {active === "settings" && (
                <SettingsTab
                  profile={profile}
                  capabilities={manageCaps}
                  userId={userId}
                  onUpdated={refetch}
                />
              )}
              {active === "activity" && <ActivityTab userId={userId} />}
              {active === "commissions" && <CommissionsView userId={userId} />}
            </Box>
          )}
        </UrlTabs>
      )}
    </Container>
  );
}

export default UserDetailPage;
