"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Button,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Collapse,
} from "@mui/material";
import { FiMenu, FiChevronDown, FiChevronRight } from "react-icons/fi";
import Logout from "@/app/UiComponents/buttons/Logout.jsx";
import NotificationsIcon from "@/app/UiComponents/utility/NotificationIcon.jsx";
import ChatNotificationIcon from "@/app/UiComponents/utility/ChatNotificationIcon.jsx";
import SignInWithDifferentUserRole from "../DataViewer/users/UserRoles";
import { useAuth } from "@/app/providers/AuthProvider";

const Navbar = ({ links }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const pathname = usePathname();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) setLoading(false);
  }, []);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleSubMenu = (linkName) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [linkName]: !prev[linkName],
    }));
  };

  const NavigationItem = ({ link, mobile = false }) => {
    const isActive = pathname.includes(link.active) || pathname === link.href;
    const hasSubLinks = link.subLinks && link.subLinks.length > 0;
    const [menuAnchor, setMenuAnchor] = useState(null); // Add local anchor state for each item

    const handleMouseEnter = (event) => {
      if (!isMobile && hasSubLinks) {
        setMenuAnchor(event.currentTarget);
      }
    };

    const handleMouseLeave = (event) => {
      if (!isMobile) {
        const menuElement = document.querySelector('[role="menu"]');
        if (menuElement) {
          const menuRect = menuElement.getBoundingClientRect();
          if (
            !(
              event.clientX >= menuRect.left &&
              event.clientX <= menuRect.right &&
              event.clientY >= menuRect.top &&
              event.clientY <= menuRect.bottom
            )
          ) {
            setMenuAnchor(null);
          }
        } else {
          setMenuAnchor(null);
        }
      }
    };
    if (mobile) {
      return (
        <>
          <ListItem
            onClick={() => (hasSubLinks ? toggleSubMenu(link.name) : null)}
            component={hasSubLinks ? "div" : "a"}
            href={hasSubLinks ? undefined : link.href}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 1.5,
              bgcolor: isActive ? "primary.light" : "transparent",
              "& .MuiListItemIcon-root": {
                color: isActive ? "primary.main" : "text.secondary",
              },
              "& .MuiListItemText-primary": {
                color: isActive ? "primary.main" : "inherit",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{link.icon}</ListItemIcon>
            <ListItemText
              primary={link.name}
              sx={{
                "& .MuiListItemText-primary": {
                  fontSize: "0.875rem",
                  fontWeight: 500,
                },
              }}
            />
            {hasSubLinks && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {openSubMenus[link.name] ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </Box>
            )}
          </ListItem>
          {hasSubLinks && (
            <Collapse
              in={openSubMenus[link.name]}
              timeout="auto"
              unmountOnExit
              sx={{
                borderLeft: `4px solid ${theme.palette.divider}`,
                pl: 2,
              }}
            >
              <List component="div" disablePadding>
                {link.subLinks.map((subLink) => (
                  <ListItem
                    key={subLink.href}
                    component={"a"}
                    href={subLink.href}
                    sx={{
                      py: 1,
                    }}
                  >
                    {subLink.icon && (
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {subLink.icon}
                      </ListItemIcon>
                    )}
                    <ListItemText
                      primary={subLink.name}
                      sx={{
                        "& .MuiListItemText-primary": {
                          fontSize: "0.815rem",
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          )}
        </>
      );
    }

    return (
      <Box
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{ position: "relative" }}
      >
        <Button
          href={hasSubLinks ? undefined : link.href}
          component={hasSubLinks ? "button" : "a"}
          startIcon={link.icon}
          endIcon={hasSubLinks ? <FiChevronDown /> : null}
          sx={{
            mx: 1,
            px: 1.5,
            borderRadius: 1,
            color: isActive ? "primary.main" : "text.primary",
            bgcolor: isActive ? "primary.light" : "transparent",
            "&:hover": {
              bgcolor: "primary.light",
              color: "primary.main",
              "& .MuiSvgIcon-root": {
                color: "primary.main",
              },
            },
          }}
        >
          {link.name}
        </Button>
        {hasSubLinks && (
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            MenuListProps={{
              onMouseLeave: () => setMenuAnchor(null),
            }}
            PaperProps={{
              sx: {
                mt: 0.5,
                minWidth: 200,
                boxShadow:
                  "0px 6px 16px rgba(0, 0, 0, 0.08), 0px 3px 6px rgba(0, 0, 0, 0.12)",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.paper",
              },
            }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            {link.subLinks.map((subLink) => (
              <MenuItem
                key={subLink.href}
                component={"a"}
                href={subLink.href}
                onClick={() => setMenuAnchor(null)}
                sx={{
                  py: 1,
                  px: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  "&:hover": {
                    bgcolor: "primary.light",
                    color: "primary.main",
                  },
                }}
              >
                {subLink.icon && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: "text.secondary",
                      "& svg": { fontSize: "1.25rem" },
                    }}
                  >
                    {subLink.icon}
                  </Box>
                )}
                {subLink.name}
              </MenuItem>
            ))}
          </Menu>
        )}
      </Box>
    );
  };
  const navigationList = (
    <List sx={{ px: 1, overflow: "hidden" }}>
      {links.map((link) => (
        <NavigationItem key={link.name} link={link} mobile={true} />
      ))}
    </List>
  );
  return (
    <>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "background.paper",
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isMobile && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <FiMenu size={24} />
              </IconButton>
            )}
            <Box
              component="img"
              src="/logo.png"
              alt="Logo"
              sx={{ height: 40, width: "auto", mr: 2 }}
            />
          </Box>
          {!isMobile && (
            <Box sx={{ display: "flex", flexGrow: 1, mx: 4 }}>
              {links.map((link) => (
                <NavigationItem key={link.name} link={link} />
              ))}
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center" }}>
            {user.role !== "ADMIN" && <SignInWithDifferentUserRole />}
            <ChatNotificationIcon />
            <NotificationsIcon />
            <Logout />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 280,
            bgcolor: "background.paper",
          },
        }}
      >
        <Toolbar />
        {navigationList}
      </Drawer>
    </>
  );
};

export default Navbar;
