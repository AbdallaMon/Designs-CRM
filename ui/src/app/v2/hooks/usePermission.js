"use client";

import { useMemo } from "react";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { splitPermissionCode } from "@/app/v2/config/permissions";

/**
 * Permission gating for the v2 UI. Derives the gate helpers from the auth user's
 * effective `permissions[]` / `permissionsByModule{}` (emitted by `GET auth/me`,
 * see auth.dto.js `toMe`). UI gating is cosmetic; the server is the source of truth.
 *
 * Combine these CODE checks with a record's backend-computed `capabilities.*` for
 * object-level gating (shared-permissions §6/§7).
 */
export function usePermission() {
  const { user } = useAuth();

  const permissions = useMemo(
    () => (Array.isArray(user?.permissions) ? user.permissions : []),
    [user],
  );
  const permissionsByModule = user?.permissionsByModule ?? {};

  const hasPermission = (code) =>
    Boolean(code) && permissions.includes(code);

  const hasAnyPermission = (codes = []) =>
    codes.some((c) => permissions.includes(c));

  const hasAllPermissions = (codes = []) =>
    codes.every((c) => permissions.includes(c));

  /** Module-level visibility helper, e.g. hasPermissionByModule("chat", "room.view"). */
  const hasPermissionByModule = (module, action) => {
    if (!module) return false;
    const code = action ? `${module}.${action}` : module;
    // fast path: exact code present
    if (permissions.includes(code)) return true;
    // fallback: any code in that module
    return permissions.some((p) => splitPermissionCode(p).module === module);
  };

  return {
    permissions,
    permissionsByModule,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasPermissionByModule,
  };
}
