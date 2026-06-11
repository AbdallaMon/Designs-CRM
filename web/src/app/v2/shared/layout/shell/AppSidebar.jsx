"use client";

// <AppSidebar /> — the permanent (desktop) / temporary (mobile) navigation drawer of the new
// shell. Modeled on the working reference's SideDrawer: a MUI <Drawer anchor="left"> (the emotion
// stylis-rtl plugin + <html dir="rtl"> flip it visually to the RIGHT — we never set anchor="right").
//
// The nav is the SAME permission-grouped model the rest of the app uses: buildVisibleNav(perm, …)
// returns [{ key, label, items: [{ key, label, href, icon }] }] with empty groups dropped. One
// <List> per group, headed by a <ListSubheader> when expanded (a <Divider> between groups when
// collapsed to icons). Active row = isPathActive(pathname, href) so /v2/leads and /v2/leads/123
// both light the leads item. Collapses to a 72px icon-only rail; tooltips (placement="left", i.e.
// toward the content in RTL) surface the labels when collapsed. Single-language Arabic / RTL.

import {
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { buildVisibleNav } from "@/app/v2/features/shell";
import { resolveNavGroup, resolveNavItem } from "@/app/v2/features/shell/navLabels";
import { isPathActive } from "@/app/v2/features/shell/breadcrumbs";

export const SIDEBAR_WIDTH_EXPANDED = 264;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

// Loading skeleton shown while auth is validating / no user yet (so the rail never flashes empty).
function SidebarNavSkeleton({ collapsed }) {
  return (
    <List sx={{ px: 1, py: 1 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton sx={{ minHeight: 46, borderRadius: 2, gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 0 }}>
              <Skeleton variant="circular" width={22} height={22} />
            </ListItemIcon>
            {!collapsed && (
              <Stack sx={{ width: "100%" }}>
                <Skeleton variant="text" width={i % 2 === 0 ? "70%" : "50%"} height={18} />
              </Stack>
            )}
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}

// Brand block at the top — "Dream Studio" wordmark (DS glyph when collapsed) linking to the landing.
function SidebarBrand({ collapsed, landingHref, onNavigate }) {
  return (
    <Box
      component={NextLink}
      href={landingHref}
      onClick={onNavigate}
      aria-label="Dream Studio"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: collapsed ? 0 : 2,
        py: 2,
        minHeight: { xs: 64, md: 72 },
        justifyContent: collapsed ? "center" : "flex-start",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: "0.95rem",
          letterSpacing: "0.02em",
          color: "primary.main",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        })}
      >
        DS
      </Box>
      {!collapsed && (
        <Typography
          variant="h6"
          noWrap
          color="primary"
          sx={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: "1.05rem" }}
        >
          Dream Studio
        </Typography>
      )}
    </Box>
  );
}

function SidebarContent({ collapsed, landingHref, onNavigate }) {
  const pathname = usePathname();
  const perm = usePermission();
  const { user, validatingAuth } = useAuth();

  const groups = buildVisibleNav(perm, resolveNavGroup, resolveNavItem);
  const loading = validatingAuth && !user;

  return (
    <Box
      role="navigation"
      aria-label="القائمة الرئيسية"
      sx={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "hidden" }}
    >
      <SidebarBrand collapsed={collapsed} landingHref={landingHref} onNavigate={onNavigate} />
      <Divider />

      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1 }}>
        {loading ? (
          <SidebarNavSkeleton collapsed={collapsed} />
        ) : (
          groups.map((group, groupIndex) => {
            const Icon = ({ icon: I }) => (I ? <I size={22} /> : null);
            return (
              <List
                key={group.key}
                sx={{ px: 1 }}
                subheader={
                  !collapsed ? (
                    <ListSubheader
                      disableSticky
                      sx={{
                        bgcolor: "transparent",
                        lineHeight: 2.2,
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "text.secondary",
                      }}
                    >
                      {group.label}
                    </ListSubheader>
                  ) : (
                    groupIndex > 0 && <Divider sx={{ my: 0.75, mx: 1 }} />
                  )
                }
              >
                {group.items.map((item) => {
                  const active = isPathActive(pathname, item.href);
                  return (
                    <ListItem
                      key={item.key}
                      disablePadding
                      sx={{ mb: 0.5 }}
                      component={NextLink}
                      href={item.href}
                      onClick={onNavigate}
                    >
                      <Tooltip
                        title={collapsed ? item.label : ""}
                        placement="left"
                        disableHoverListener={!collapsed}
                      >
                        <ListItemButton
                          selected={active}
                          aria-current={active ? "page" : undefined}
                          sx={{
                            minHeight: 46,
                            borderRadius: 2,
                            gap: 1.5,
                            px: collapsed ? 1.5 : 2,
                            justifyContent: collapsed ? "center" : "flex-start",
                          }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 0,
                              color: active ? "primary.main" : "text.secondary",
                            }}
                          >
                            <Icon icon={item.icon} />
                          </ListItemIcon>
                          {!collapsed && (
                            <ListItemText
                              primary={item.label}
                              primaryTypographyProps={{
                                noWrap: true,
                                sx: { fontWeight: active ? 700 : 500 },
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    </ListItem>
                  );
                })}
              </List>
            );
          })
        )}
      </Box>
    </Box>
  );
}

export function AppSidebar({
  collapsed = false,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
  landingHref = "/v2",
}) {
  const width = collapsed && !isMobile ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
  // On the temporary (mobile) drawer the nav is always expanded; collapse is a desktop affordance.
  const contentCollapsed = isMobile ? false : collapsed;

  const content = (
    <SidebarContent
      collapsed={contentCollapsed}
      landingHref={landingHref}
      onNavigate={isMobile ? onMobileClose : undefined}
    />
  );

  return (
    <Drawer
      // anchor="left" — the rtl stylis plugin flips it to the visual RIGHT. NEVER anchor="right".
      anchor="left"
      variant={isMobile ? "temporary" : "permanent"}
      open={isMobile ? mobileOpen : true}
      onClose={onMobileClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          overflowX: "hidden",
          transition: (theme) =>
            theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
        },
      }}
    >
      {content}
    </Drawer>
  );
}

export default AppSidebar;
