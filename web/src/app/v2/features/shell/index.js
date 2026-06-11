// Barrel for the app-shell feature (UX redesign Phase 0).

export { AppShell } from "./components/AppShell";
export { SideNav } from "./components/SideNav";
export { TopBar } from "./components/TopBar";
export { NotificationBell } from "./components/NotificationBell";
export { NAV_ITEMS, NAV_GROUP_ORDER, buildVisibleNav, navItemVisible } from "./nav.config";
export { buildBreadcrumbs, isPathActive, matchNavItem } from "./breadcrumbs";
export { resolveNavGroup, resolveNavItem } from "./navLabels";
export { buildRoleChips, resolveRoleLabel } from "./roleLabels";
