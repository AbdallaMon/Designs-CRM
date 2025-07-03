"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  MdConstruction,
  MdDashboard,
  MdImage,
  MdPattern,
  MdRoom,
  MdStyle,
} from "react-icons/md";
import ImageManager from "./ImageManager";
import SpaceManager from "./space/SpaceManager";
import StyleManager from "./style/StyleItemManager";
import MaterialManager from "./material/MaterialManager.jsx";
import ColorsMangaer from "./color/ColorsManager.jsx";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const tabs = [
    {
      label: "Gallery",
      icon: <MdImage />,
      component: <ImageManager />,
      key: "gallery",
    },
    {
      label: "Patterns",
      icon: <MdPattern />,
      component: <ColorsMangaer />,
      key: "patterns",
    },
    {
      label: "Spaces",
      icon: <MdRoom />,
      component: <SpaceManager />,
      key: "spaces",
    },
    {
      label: "Materials",
      icon: <MdConstruction />,
      component: <MaterialManager />,
      key: "materials",
    },
    {
      label: "Styles",
      icon: <MdStyle />,
      component: <StyleManager />,
      key: "styles",
    },
  ];

  // Get initial tab from URL search params, default to 0 if not found or invalid
  const getInitialTab = () => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const tabIndex = parseInt(tabParam, 10);
      // Validate that the tab index is within valid range
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex < tabs.length) {
        return tabIndex;
      }
    }
    return 0; // Default to first tab
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  // Update active tab when URL search params change
  useEffect(() => {
    const tabFromURL = getInitialTab();
    if (tabFromURL !== activeTab) {
      setActiveTab(tabFromURL);
    }
  }, [searchParams]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);

    // Update URL search params
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newValue.toString());

    // Use replace to avoid creating new history entries for each tab change
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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
          {/* Optional: Show current tab name */}
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {tabs[activeTab]?.label}
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
