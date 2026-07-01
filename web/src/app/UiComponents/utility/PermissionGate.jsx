"use client";
import { usePermission } from "@/app/hooks/usePermission";

export default function PermissionGate({
  required = [],
  anyOf = [],
  fallback = null,
  children,
}) {
  const { hasAllPermissions, hasAnyPermission } = usePermission();
  const okRequired = required.length ? hasAllPermissions(required) : true;
  const okAny = anyOf.length ? hasAnyPermission(anyOf) : true;
  return okRequired && okAny ? <>{children}</> : fallback;
}
