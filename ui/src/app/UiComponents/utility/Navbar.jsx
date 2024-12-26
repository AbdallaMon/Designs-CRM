import React, { useState } from 'react';
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
    Badge,
} from '@mui/material';
import {
    FiMenu,
    FiBell,
    FiLogOut
} from 'react-icons/fi';
import Logout from "@/app/UiComponents/buttons/Logout.jsx";
import NotificationsIcon from "@/app/UiComponents/utility/NotificationIcon.jsx";

// Admin navigation links
const Navbar = ({ links }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [notificationCount] = useState(3); // Example notification count

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navigationList = (
          <List>
              {links.map((link) => (
                    <ListItem
                          button
                          key={link.name}
                          component="a"
                          href={link.href}
                          sx={{
                              borderRadius: 1,
                              mx: 1,
                              mb: 1,
                              '&:hover': {
                                  bgcolor: 'primary.light',
                                  '& .MuiListItemIcon-root': {
                                      color: 'primary.main',
                                  }
                              }
                          }}
                    >
                        <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
                            {link.icon}
                        </ListItemIcon>
                        <ListItemText
                              primary={link.name}
                              sx={{
                                  '& .MuiListItemText-primary': {
                                      fontSize: '0.875rem',
                                      fontWeight: 500
                                  }
                              }}
                        />
                    </ListItem>
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
                        bgcolor: 'background.paper',
                    }}
              >
                  <Toolbar sx={{ justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                          {/* Logo or Brand */}
                          <Box
                                component="img"
                                src="/logo.png"
                                alt="Logo"
                                sx={{ height: 40, width: 'auto', mr: 2 }}
                          />
                      </Box>

                      {!isMobile && (
                            <Box sx={{ display: 'flex', flexGrow: 1, mx: 4 }}>
                                {links.map((link) => (
                                      <Button
                                            key={link.name}
                                            href={link.href}
                                            startIcon={link.icon}
                                            sx={{
                                                mx: 1,
                                                color: 'text.primary',
                                                '&:hover': {
                                                    bgcolor: 'primary.light',
                                                    '& .MuiSvgIcon-root': {
                                                        color: 'primary.main',
                                                    }
                                                }
                                            }}
                                      >
                                          {link.name}
                                      </Button>
                                ))}
                            </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotificationsIcon/>
                          <Logout/>
                      </Box>
                  </Toolbar>
              </AppBar>

              <Drawer
                    variant="temporary"
                    anchor="right" // RTL support
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better mobile performance
                    }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: 280,
                            bgcolor: 'background.paper'
                        },
                    }}
              >
                  <Toolbar /> {/* Spacing for AppBar */}
                  {navigationList}
              </Drawer>

              {/* Permanent Drawer for desktop */}

          </>
    );
};

export default Navbar;