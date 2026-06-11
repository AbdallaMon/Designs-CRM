// Barrel for the app-shell feature (UX redesign Phase 0).
//
// The rejected workspace-rail/command-palette shell (AppShellV2 / WorkspaceRail / WorkspacePanel /
// CommandBar / CommandPalette + the WORKSPACE-* helpers) has been removed in favor of the
// sidebar+header shell at shared/layout/shell. What remains here is the permission-grouped nav
// model, the Arabic label maps, the breadcrumb derivation, the notification bell, the role chips,
// and the /v2 landing fan-out — all consumed by the new shell.

export { NotificationBell } from "./components/NotificationBell";
export { LandingRedirect } from "./components/LandingRedirect";
export {
  NAV_ITEMS,
  NAV_GROUP_ORDER,
  buildVisibleNav,
  navItemVisible,
} from "./nav.config";
export { buildBreadcrumbs, isPathActive, matchNavItem } from "./breadcrumbs";
export {
  resolveNavGroup,
  resolveNavItem,
  DEFAULT_DESTINATION_BY_ROLE,
  resolveDefaultDestination,
} from "./navLabels";
export { buildRoleChips, resolveRoleLabel } from "./roleLabels";
