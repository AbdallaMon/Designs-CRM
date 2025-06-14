"use client";
import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  AppBar,
  Toolbar,
  Badge,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  MdAnalytics,
  MdDashboard,
  MdImage,
  MdPattern,
  MdRoom,
} from "react-icons/md";
import ImageManager from "./ImageManager";
import ColorPatternManager from "./ColorPattern";
import SpaceManager from "./SpaceManager";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`gallery-tabpanel-${index}`}
      aria-labelledby={`gallery-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
    </div>
  );
}

const GalleryDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    {
      label: "Gallery",
      icon: <MdImage />,
      component: <ImageManager />,
    },
    {
      label: "Patterns",
      icon: <MdPattern />,
      component: <ColorPatternManager />,
    },
    {
      label: "Spaces",
      icon: <MdRoom />,
      component: <SpaceManager />,
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 82px)",
        overflowY: "auto",
      }}
    >
      {/* App Bar */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "background.paper", color: "text.primary" }}
      >
        <Toolbar>
          <MdDashboard sx={{ mr: 2, color: "primary.main" }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "text.primary" }}
          >
            Gallery Management
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {/* Sidebar Navigation */}
        <Paper
          elevation={0}
          sx={{
            width: isMobile ? "100%" : 280,
            borderRight: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Tabs
            orientation={isMobile ? "horizontal" : "vertical"}
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderRight: isMobile ? 0 : 1,
              borderBottom: isMobile ? 1 : 0,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 64,
                textAlign: "left",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                px: 3,
                py: 2,
              },
            }}
            variant={isMobile ? "fullWidth" : "standard"}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{
                  "& .MuiTab-iconWrapper": {
                    marginRight: 2,
                    marginBottom: 0,
                  },
                }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: "auto",
            backgroundColor: "background.default",
          }}
        >
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={activeTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default GalleryDashboard;
