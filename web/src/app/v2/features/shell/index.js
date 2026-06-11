// Barrel for the app-shell feature (UX redesign Phase 0).

export { AppShellV2 } from "./components/AppShellV2";
export { WorkspaceRail } from "./components/WorkspaceRail";
export { WorkspacePanel } from "./components/WorkspacePanel";
export { CommandBar } from "./components/CommandBar";
export { CommandPalette } from "./components/CommandPalette";
export { NotificationBell } from "./components/NotificationBell";
export { LandingRedirect } from "./components/LandingRedirect";
export {
  NAV_ITEMS,
  NAV_GROUP_ORDER,
  WORKSPACES,
  WORKSPACE_ORDER,
  buildVisibleNav,
  buildWorkspaceNav,
  navItemVisible,
} from "./nav.config";
export { buildBreadcrumbs, isPathActive, matchNavItem } from "./breadcrumbs";
export {
  resolveNavGroup,
  resolveNavItem,
  resolveWorkspaceLabel,
  DEFAULT_WORKSPACE_BY_ROLE,
  resolveDefaultWorkspace,
} from "./navLabels";
export { buildRoleChips, resolveRoleLabel } from "./roleLabels";
