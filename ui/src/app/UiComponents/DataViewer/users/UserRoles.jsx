"use client";

import { getData } from "@/app/helpers/functions/getData";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Divider,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Fade,
  DialogActions,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdOutlineSwitchAccount, MdClose } from "react-icons/md";
import {
  FaUserShield,
  FaUserTie,
  FaCube,
  FaPalette,
  FaCalculator,
  FaCrown,
} from "react-icons/fa";

// Role configuration with icons and colors
const roleConfig = {
  ADMIN: {
    icon: <FaUserShield />,
    color: "#1976d2",
    label: "Administrator",
    description: "Full system access and management",
  },
  STAFF: {
    icon: <FaUserTie />,
    color: "#388e3c",
    label: "Sales",
    description: "Lead management and customer service",
  },
  THREE_D_DESIGNER: {
    icon: <FaCube />,
    color: "#f57c00",
    label: "3D Designer",
    description: "3D modeling",
  },
  TWO_D_DESIGNER: {
    icon: <FaPalette />,
    color: "#7b1fa2",
    label: "2D Designer",
    description: "2D graphics",
  },
  ACCOUNTANT: {
    icon: <FaCalculator />,
    color: "#00796b",
    label: "Accountant",
    description: "Financial management and reporting",
  },
  SUPER_ADMIN: {
    icon: <FaCrown />,
    color: "#d32f2f",
    label: "Super Administrator",
    description: "Full system access and management",
  },
};

export default function SignInWithDifferentUserRole() {
  const [open, setOpen] = useState(false);
  const { user, setUser } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    async function getUserRoles() {
      const rolesReq = await getData({
        url: "shared/utilities/roles",
        setLoading,
      });
      if (rolesReq && rolesReq.status === 200) setRoles(rolesReq.data);
    }
    getUserRoles();
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setUser({ ...user, role });
    localStorage.setItem("role", role);
    localStorage.setItem("userId", user.id);

    setTimeout(() => {
      setOpen(false);
      window.location.href = "/dashboard";
    }, 500);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedRole(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<MdOutlineSwitchAccount />}
        onClick={() => setOpen(true)}
        sx={{
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 500,
          px: 3,
          py: 1,
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: 2,
          },
          transition: "all 0.2s ease-in-out",
        }}
      >
        Switch Role
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: 400,
          },
        }}
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <MdOutlineSwitchAccount size={24} />
              <Typography variant="h6" fontWeight={600}>
                Select Your Role
              </Typography>
            </Box>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{ color: "grey.500" }}
            >
              <MdClose />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Choose the role you want to switch to
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={6}
            >
              <CircularProgress size={40} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading available roles...
              </Typography>
            </Box>
          ) : roles.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={6}
            >
              <Typography variant="body1" color="text.secondary">
                No roles available
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, overflowX: "hidden" }}>
              {roles.map((role, index) => {
                const config = roleConfig[role] || {
                  icon: <FaUserTie />,
                  color: "#666",
                  label: role,
                  description: "Role access",
                };
                const isSelected = selectedRole === role;
                const isCurrentRole = user?.role === role;

                return (
                  <ListItem
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    sx={{
                      cursor: "pointer",
                      py: 2,
                      px: 3,
                      borderBottom:
                        index < roles.length - 1 ? "1px solid" : "none",
                      borderColor: "divider",
                      transition: "all 0.2s ease-in-out",
                      backgroundColor: isSelected
                        ? `${config.color}15`
                        : isCurrentRole
                        ? "action.selected"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? `${config.color}25`
                          : `${config.color}08`,
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: config.color,
                        minWidth: 48,
                        fontSize: "1.25rem",
                      }}
                    >
                      {config.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {config.label}
                          </Typography>
                          {isCurrentRole && (
                            <Chip
                              label="Current"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ height: 20, fontSize: "0.75rem" }}
                            />
                          )}
                          {isSelected && (
                            <Chip
                              label="Selected"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.75rem",
                                backgroundColor: config.color,
                                color: "white",
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {config.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {selectedRole ? "Switching role..." : "Select a role to continue"}
          </Typography>
        </DialogActions>
      </Dialog>
    </>
  );
}
