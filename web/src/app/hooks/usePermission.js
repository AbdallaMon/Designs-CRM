"use client";
import { useMemo } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { makePermissionApi } from "./permissionApi.js";

export function usePermission() {
  const { permissions, permissionsByModule } = useAuth();
  return useMemo(
    () => makePermissionApi(permissions, permissionsByModule),
    [permissions, permissionsByModule],
  );
}
