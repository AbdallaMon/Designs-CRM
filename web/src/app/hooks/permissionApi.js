// Pure, import-free predicate logic for permission checks.
// Kept free of React/Next imports so it can be unit-tested in plain node
// without pulling in the AuthProvider import chain.

export function makePermissionApi(permissions = [], permissionsByModule = {}) {
  const set = new Set(permissions);
  return {
    hasPermission: (code) => set.has(code),
    hasAnyPermission: (codes = []) => codes.some((c) => set.has(c)),
    hasAllPermissions: (codes = []) => codes.every((c) => set.has(c)),
    hasAction: (module, flag) => Boolean(permissionsByModule?.[module]?.[flag]),
  };
}
