"use client";
import React from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { MdMoreHoriz, MdVisibility } from "react-icons/md";
import ConfirmWithActionModel from "@/shared/components/models/ConfirmsWithActionModel.jsx";
import UserRestrictedCountries from "@/features/users/UserRestrictedCountries";
import Commission from "@/features/accountant/Commission";
import { ProfileManagerDialog } from "@/features/users/ProfileManagerDialog";
import { ProjectAutoAssignmentDialog } from "@/features/users/ProjectAutoAssignmentDialog";

export default function UserRowActions({ item, setData, banAUser }) {
  const theme = useTheme();
  const smDown = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const ViewButton = (
    <Button
      component={Link}
      href={`/dashboard/users/${item.id}`}
      size="small"
      variant="outlined"
      startIcon={<MdVisibility />}
      sx={{ whiteSpace: "nowrap", borderRadius: 2, fontWeight: 600 }}
    >
      View
    </Button>
  );

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      flexWrap="wrap"
      sx={{
        minWidth: 220,
        maxWidth: 520,
      }}
    >
      <Tooltip title="More actions">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            border: (t) => `1px solid ${t.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <MdMoreHoriz />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 280, p: 1, borderRadius: 3 } }}
      >
        <Typography
          variant="overline"
          sx={{
            px: 1.5,
            py: 0.5,
            display: "block",
            fontWeight: 700,
            color: "text.secondary",
          }}
        >
          Manage user
        </Typography>
        <Divider sx={{ mb: 0.5 }} />
        {/* On small screens, show the view button inside the menu */}
        {smDown && (
          <Box sx={{ px: 1, pb: 1, display: "grid", gap: 1 }}>
            {ViewButton}
          </Box>
        )}

        {/* Your existing components render their own buttons; put them inside the menu nicely */}
        <Box sx={{ px: 1, py: 0.5 }}>
          <ConfirmWithActionModel
            title={
              item.isActive
                ? "Are you sure you want to ban this user?"
                : "Are you sure you want to unban this user?"
            }
            handleConfirm={async () => {
              await banAUser(item);
              setAnchorEl(null);
            }}
            isDelete={item.isActive}
            label={item.isActive ? "Ban User" : "Unban User"}
            fullWidth={true}
          />
        </Box>

        <Box sx={{ px: 1, py: 0.5 }}>
          <ProfileManagerDialog
            userId={item.id}
            userProfiles={item.userProfiles}
            currentProfileId={item.currentProfileId}
            setData={setData}
          />
        </Box>
        <Box sx={{ px: 1, py: 0.5 }}>
          <ProjectAutoAssignmentDialog userId={item.id} />
        </Box>
        <Box sx={{ px: 1, py: 0.5 }}>
          <UserRestrictedCountries userId={item.id} />
        </Box>

        <Box sx={{ px: 1, py: 0.5 }}>
          <Commission userId={item.id} />
        </Box>
      </Menu>
      {!smDown && (
        <Box sx={{ display: "inline-flex", gap: 1, flexWrap: "wrap" }}>
          {ViewButton}
        </Box>
      )}
    </Stack>
  );
}
