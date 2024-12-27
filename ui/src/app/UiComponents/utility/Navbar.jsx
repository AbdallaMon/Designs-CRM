import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
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
} from '@mui/material';
import { FiMenu } from 'react-icons/fi';
import Logout from "@/app/UiComponents/buttons/Logout.jsx";
import NotificationsIcon from "@/app/UiComponents/utility/NotificationIcon.jsx";
import Link from "next/link";

const Navbar = ({ links }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const pathname = usePathname();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const navigationList = (
          <List sx={{px:1,overflow:"hidden"}}>
              {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                        <ListItem
                              button
                              key={link.name}
                              component={Link}
                              href={link.href}
                              sx={{
                                  borderRadius: 1,
                                  mx: 1,
                                  mb: 1.5,
                                  bgcolor: isActive ? 'primary.light' : 'transparent',
                                  '& .MuiListItemIcon-root': {
                                      color: isActive ? 'primary.main' : 'text.secondary',
                                  },
                                  '& .MuiListItemText-primary': {
                                      color: isActive ? 'primary.main' : 'inherit',
                                  },
                                  '&:hover': {
                                      bgcolor: 'primary.light',
                                      '& .MuiListItemIcon-root': {
                                          color: 'primary.main',
                                      },
                                      '& .MuiListItemText-primary': {
                                          color: 'primary.main',
                                      }
                                  }
                              }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
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
                  );
              })}
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
                          <Box
                                component="img"
                                src="/logo.png"
                                alt="Logo"
                                sx={{ height: 40, width: 'auto', mr: 2 }}
                          />
                      </Box>
                      {!isMobile && (
                            <Box sx={{ display: 'flex', flexGrow: 1, mx: 4 }}>
                                {links.map((link) => {
                                    const isActive = pathname === link.href;
                                    return (
                                          <Button
                                                key={link.name}
                                                href={link.href}
                                                startIcon={link.icon}
                                                sx={{
                                                    mx: 1,
                                                    px: 1.5,
                                                    borderRadius:1,
                                                    color: isActive ? 'primary.main' : 'text.primary',
                                                    bgcolor: isActive ? 'primary.light' : 'transparent',
                                                    '&:hover': {
                                                        bgcolor: 'primary.light',
                                                        color: 'primary.main',
                                                        '& .MuiSvgIcon-root': {
                                                            color: 'primary.main',
                                                        }
                                                    }
                                                }}
                                          >
                                              {link.name}
                                          </Button>
                                    );
                                })}
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
                    anchor="left"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
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
                  <Toolbar />
                  {navigationList}
              </Drawer>
          </>
    );
};

export default Navbar;