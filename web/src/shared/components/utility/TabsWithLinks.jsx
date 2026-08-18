"use client";
import React from "react";
import { Tab, Tabs, Box, Typography, Button } from "@mui/material";
import Link from "next/link";

export default function TabsWithLinks({ links, sx, compact = false }) {
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  if (links.length === 1) {
    return (
      <Box
        sx={[
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: compact ? 0 : "10px",
          },
          sx,
        ]}
      >
        <Button
          variant="outlined"
          color="primary"
          startIcon={links[0].icon}
          component={Link}
          href={links[0].href}
          size={compact ? "small" : "medium"}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            minHeight: compact ? 32 : undefined,
            fontSize: compact ? "0.75rem" : undefined,
          }}
        >
          {links[0].title}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: compact ? 0 : "10px",
          gap: compact ? 1 : "16px",
        },
        sx,
      ]}
    >
      <Tabs
        value={selectedTab}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        variant="scrollable"
        scrollButtons="auto"
      >
        {links.map((link, index) => (
          <Tab
            key={index}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textTransform: "none",
                  fontWeight: "bold",
                  cursor: "pointer",
                  "&:hover": {
                    color: "primary.main",
                    textDecoration: "underline",
                  },
                }}
              >
                <span style={{ fontSize: "20px" }}>{link.icon}</span>
                <Typography>{link.title}</Typography>
              </Box>
            }
            component={Link}
            href={link.href}
            disableRipple
            sx={compact ? { minHeight: 32, py: 0.5, fontSize: "0.75rem" } : undefined}
          />
        ))}
      </Tabs>
    </Box>
  );
}
