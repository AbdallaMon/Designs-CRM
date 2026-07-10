"use client";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Collapse,
  Typography,
  Divider,
} from "@mui/material";
import {
  FiChevronDown,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiX,
} from "react-icons/fi";
import colors from "@/app/helpers/colors";

export const SIDENAV_EXPANDED_WIDTH = 264;
export const SIDENAV_COLLAPSED_WIDTH = 72;

/**
 * Does the given link (or one of its subLinks) match the current path?
 * Mirrors the matching used by the legacy Navbar.
 */
function isLinkActive(link, pathname) {
  const matchOne = (l) => {
    if (l.active) return pathname.includes(l.active);
    return pathname === l.href;
  };
  if (matchOne(link)) return true;
  if (link.subLinks?.length) return link.subLinks.some(matchOne);
  return false;
}

function isExactActive(l, pathname) {
  if (l.active) return pathname.includes(l.active);
  return pathname === l.href;
}

/**
 * Sectioned, collapsible side navigation.
 * - Desktop: permanent drawer anchored to the inline-start side (right for RTL).
 * - Collapsed: slim icon-only rail with tooltips.
 * - Mobile: temporary drawer toggled by the layout's hamburger.
 */
const SideNav = ({
  links,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onMobileClose,
  isMobile,
}) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState({});

  // Auto-open the section that contains the active route.
  useEffect(() => {
    const next = {};
    links.forEach((link) => {
      if (link.subLinks?.length && isLinkActive(link, pathname)) {
        next[link.name] = true;
      }
    });
    setOpenSections((prev) => ({ ...next, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, links]);

  const toggleSection = (name) =>
    setOpenSections((prev) => ({ ...prev, [name]: !prev[name] }));

  // When collapsed on desktop there are no labels, so sections behave as
  // flyout-less icon groups: clicking the header expands the rail first.
  const railCollapsed = !isMobile && collapsed;

  const itemBaseSx = {
    borderRadius: 2,
    mx: railCollapsed ? 0.75 : 1.25,
    my: 0.25,
    minHeight: 44,
    justifyContent: railCollapsed ? "center" : "flex-start",
    px: railCollapsed ? 1 : 1.5,
    color: colors.textSecondary,
    // Reserve the accent-bar gutter so active/inactive items never shift width.
    borderInlineStart: "3px solid transparent",
    transition:
      "background-color .15s ease, color .15s ease, border-color .15s ease",
    "&:hover": {
      backgroundColor: colors.primaryAlt,
      color: colors.primaryDark,
    },
  };

  const activeSx = {
    backgroundColor: colors.primaryAlt,
    color: colors.primaryDark,
    fontWeight: 600,
    // Inline-start accent bar marks the active route (RTL-safe).
    borderInlineStartColor: colors.primary,
    "&:hover": { backgroundColor: colors.primaryAlt },
  };

  const iconSx = (active) => ({
    minWidth: railCollapsed ? 0 : 38,
    justifyContent: "center",
    color: active ? colors.primaryDark : colors.textTertiary,
    "& svg": { fontSize: 20, display: "block" },
  });

  const renderStandalone = (link) => {
    const active = isLinkActive(link, pathname);
    const button = (
      <ListItemButton
        component="a"
        href={link.href}
        selected={active}
        sx={{ ...itemBaseSx, ...(active ? activeSx : {}) }}
        aria-label={link.name}
      >
        <ListItemIcon sx={iconSx(active)}>{link.icon}</ListItemIcon>
        {!railCollapsed && (
          <ListItemText
            primary={link.name}
            primaryTypographyProps={{
              fontSize: "0.875rem",
              fontWeight: active ? 600 : 500,
              noWrap: true,
            }}
          />
        )}
      </ListItemButton>
    );
    return (
      <Box component="li" key={link.name} sx={{ listStyle: "none" }}>
        {railCollapsed ? (
          <Tooltip title={link.name} placement="right" arrow>
            {button}
          </Tooltip>
        ) : (
          button
        )}
      </Box>
    );
  };

  const renderSection = (link) => {
    const sectionActive = isLinkActive(link, pathname);
    const open = railCollapsed ? false : !!openSections[link.name];

    const header = (
      <ListItemButton
        onClick={() => {
          if (railCollapsed) {
            // Expand the rail so the user can read the section.
            onToggleCollapsed?.(false);
            setOpenSections((p) => ({ ...p, [link.name]: true }));
          } else {
            toggleSection(link.name);
          }
        }}
        sx={{
          ...itemBaseSx,
          ...(sectionActive && !open ? activeSx : {}),
        }}
        aria-expanded={open}
        aria-label={link.name}
      >
        <ListItemIcon sx={iconSx(sectionActive)}>{link.icon}</ListItemIcon>
        {!railCollapsed && (
          <>
            <ListItemText
              primary={link.name}
              primaryTypographyProps={{
                fontSize: "0.875rem",
                fontWeight: sectionActive ? 600 : 500,
                noWrap: true,
              }}
            />
            <Box
              component="span"
              sx={{ display: "flex", color: colors.textMuted, ml: 0.5 }}
            >
              {open ? <FiChevronDown /> : <FiChevronRight />}
            </Box>
          </>
        )}
      </ListItemButton>
    );

    return (
      <Box component="li" key={link.name} sx={{ listStyle: "none" }}>
        {railCollapsed ? (
          <Tooltip title={link.name} placement="right" arrow>
            {header}
          </Tooltip>
        ) : (
          header
        )}
        {!railCollapsed && (
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="ul" disablePadding sx={{ pl: 0 }}>
              {link.subLinks.map((sub) => {
                const subActive = isExactActive(sub, pathname);
                return (
                  <Box
                    component="li"
                    key={sub.href}
                    sx={{ listStyle: "none" }}
                  >
                    <ListItemButton
                      component="a"
                      href={sub.href}
                      selected={subActive}
                      sx={{
                        ...itemBaseSx,
                        // inset to read as a child of the section (RTL-safe)
                        ms: 2.5,
                        me: 1.25,
                        mx: 0,
                        minHeight: 38,
                        ...(subActive ? activeSx : {}),
                      }}
                      aria-label={sub.name}
                    >
                      {sub.icon && (
                        <ListItemIcon sx={iconSx(subActive)}>
                          {sub.icon}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={sub.name}
                        primaryTypographyProps={{
                          fontSize: "0.82rem",
                          fontWeight: subActive ? 600 : 400,
                          noWrap: true,
                        }}
                      />
                    </ListItemButton>
                  </Box>
                );
              })}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const navList = useMemo(
    () => (
      <List
        component="ul"
        sx={{ px: 0, py: 1, flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}
      >
        {links.map((link) =>
          link.subLinks?.length ? renderSection(link) : renderStandalone(link)
        )}
      </List>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [links, pathname, openSections, railCollapsed]
  );

  const header = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: railCollapsed ? "center" : "space-between",
        gap: 1,
        px: railCollapsed ? 0 : 1.5,
        py: 1,
        minHeight: 64,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      {!railCollapsed && (
        <Box
          component="img"
          src="/logo.png"
          alt="Logo"
          sx={{ height: 38, width: "auto" }}
        />
      )}
      {isMobile ? (
        <IconButton
          onClick={onMobileClose}
          aria-label="Close menu"
          size="small"
          sx={{ color: colors.textSecondary }}
        >
          <FiX size={20} />
        </IconButton>
      ) : (
        <Tooltip
          title={collapsed ? "Expand menu" : "Collapse menu"}
          placement="right"
          arrow
        >
          <IconButton
            onClick={() => onToggleCollapsed?.(!collapsed)}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            size="small"
            sx={{ color: colors.textSecondary }}
          >
            {/* RTL: collapsing pushes the drawer toward the start (right) */}
            {collapsed ? <FiChevronsLeft size={18} /> : <FiChevronsRight size={18} />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  const content = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.paperBg,
      }}
    >
      {header}
      {navList}
      <Divider sx={{ borderColor: colors.borderLight }} />
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: SIDENAV_EXPANDED_WIDTH,
            borderRight: `1px solid ${colors.borderLight}`,
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: collapsed ? SIDENAV_COLLAPSED_WIDTH : SIDENAV_EXPANDED_WIDTH,
        flexShrink: 0,
        whiteSpace: "nowrap",
        "& .MuiDrawer-paper": {
          boxSizing: "border-box",
          width: collapsed ? SIDENAV_COLLAPSED_WIDTH : SIDENAV_EXPANDED_WIDTH,
          overflowX: "hidden",
          borderRight: `1px solid ${colors.borderLight}`,
          transition: "width .2s ease",
        },
      }}
    >
      {content}
    </Drawer>
  );
};

export default SideNav;
