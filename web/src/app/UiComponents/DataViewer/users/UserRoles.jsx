"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
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
  Fade,
  DialogActions,
} from "@mui/material";
import { useState } from "react";
import { MdOutlineSwitchAccount, MdClose } from "react-icons/md";
import { FaUserShield, FaUserTie, FaPalette, FaCalculator } from "react-icons/fa";

// Icon + color per profile FAMILY (from /auth/me profiles[].family).
const familyConfig = {
  ADMIN: { icon: <FaUserShield />, color: "#1976d2" },
  SALES: { icon: <FaUserTie />, color: "#388e3c" },
  DESIGN: { icon: <FaPalette />, color: "#7b1fa2" },
  FINANCE: { icon: <FaCalculator />, color: "#00796b" },
};
const fallbackConfig = { icon: <FaUserTie />, color: "#666" };

// Real profile switcher (dialog UX). Lists the profiles assigned to the current
// user (from /auth/me) and performs a SERVER-SIDE switch via /auth/profile/switch,
// then refetches /auth/me so the whole app (nav + permissions) re-gates. Hidden
// when the user holds a single profile.
export default function SignInWithDifferentUserRole() {
  const [open, setOpen] = useState(false);
  const { profiles = [], currentProfileId, refetchMe } = useAuth();
  const { setLoading } = useToastContext();

  if (!Array.isArray(profiles) || profiles.length <= 1) return null;

  async function handleSelect(profileId) {
    if (profileId === currentProfileId) {
      setOpen(false);
      return;
    }
    const res = await handleRequestSubmit(
      { profileId },
      setLoading,
      "auth/profile/switch",
      false,
      "جارٍ تبديل الدور...",
      null,
      "POST",
    );
    if (res?.success === true || res?.status === 200) {
      await refetchMe();
      setOpen(false);
    }
  }

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
          "&:hover": { transform: "translateY(-2px)", boxShadow: 2 },
          transition: "all 0.2s ease-in-out",
        }}
      >
        تبديل الدور
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, minHeight: 320 } }}
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <MdOutlineSwitchAccount size={24} />
              <Typography variant="h6" fontWeight={600}>
                اختر دورك
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} size="small" sx={{ color: "grey.500" }}>
              <MdClose />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            اختر الدور الذي تريد التبديل إليه
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 0 }}>
          <List sx={{ p: 0, overflowX: "hidden" }}>
            {profiles.map((profile, index) => {
              const config = familyConfig[profile.family] || fallbackConfig;
              const isCurrent = profile.id === currentProfileId;
              return (
                <ListItem
                  key={profile.id}
                  onClick={() => handleSelect(profile.id)}
                  sx={{
                    cursor: "pointer",
                    py: 2,
                    px: 3,
                    borderBottom: index < profiles.length - 1 ? "1px solid" : "none",
                    borderColor: "divider",
                    transition: "all 0.2s ease-in-out",
                    backgroundColor: isCurrent ? "action.selected" : "transparent",
                    "&:hover": {
                      backgroundColor: `${config.color}12`,
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: config.color, minWidth: 48, fontSize: "1.25rem" }}>
                    {config.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {profile.label}
                        </Typography>
                        {isCurrent && (
                          <Chip
                            label="الحالي"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ height: 20, fontSize: "0.75rem" }}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">
            إلغاء
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
