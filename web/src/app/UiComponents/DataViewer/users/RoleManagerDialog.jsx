import { roleIcons, userRolesEnum } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { usePermission } from "@/app/hooks/usePermission";
import { USER_CODES } from "@/app/helpers/permissionCodes";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete } from "react-icons/md";
import { FiShield } from "react-icons/fi";

const roleLabel = (r) => userRolesEnum?.[r] || r;

export const RoleManagerDialog = ({ role, subRoles, setData, userId }) => {
  const allRoles = Object.keys(roleIcons); // Available roles
  const [open, setOpen] = useState(false);
  const [selectedSubRoles, setSelectedSubRoles] = useState([...subRoles]); // SubRoles state
  const [tempRole, setTempRole] = useState(""); // Temp role to add
  const { setLoading } = useToastContext();
  // Approved normalization (profiles sweep): manage-roles dialog moved off checkIfAdmin
  // (ADMIN/SUPER_ADMIN/CONTACT_INITIATOR) to the user.manage_roles code — drops
  // CONTACT_INITIATOR, adds isSuperSales (matches the proper admin-tier grant).
  const { hasPermission } = usePermission();
  const admin = hasPermission(USER_CODES.MANAGE_ROLES);
  function onClose() {
    setOpen(false);
  }
  async function onSave(updatedRoles) {
    const request = await handleRequestSubmit(
      updatedRoles,
      setLoading,
      `admin/users/${userId}/roles`,
      false,
      "Updating roles",
      null,
      "PUT"
    );
    if (request.status === 200) {
      window.location.reload();
      onClose();
    }
  }
  useEffect(() => {
    setSelectedSubRoles([...subRoles]); // Sync when props change
  }, [subRoles]);

  // Add a new role if not already in the list
  const handleAddRole = () => {
    if (tempRole && !selectedSubRoles.includes(tempRole)) {
      setSelectedSubRoles([...selectedSubRoles, tempRole]);
      setTempRole(""); // Reset selection
    }
  };

  // Remove role from subRoles list
  const handleRemoveRole = (roleToRemove) => {
    setSelectedSubRoles(selectedSubRoles.filter((r) => r !== roleToRemove));
  };

  // Save changes and send to API
  const handleSave = () => {
    const updatedRoles = {
      added: selectedSubRoles.filter((r) => !subRoles.includes(r)), // New roles
      removed: subRoles.filter((r) => !selectedSubRoles.includes(r)), // Deleted roles
    };
    onSave(updatedRoles);
  };
  if (!admin) return null; // Only admins can manage roles
  if (!open)
    return (
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        fullWidth
        startIcon={<FiShield />}
        sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
      >
        Manage Roles
      </Button>
    );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.25, fontWeight: 700 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <FiShield />
        </Box>
        Manage User Roles
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" fontWeight={700} color="text.secondary">
              Main Role
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                icon={<span style={{ fontSize: 16 }}>{roleIcons[role]}</span>}
                label={roleLabel(role)}
                sx={{
                  fontWeight: 700,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                  color: "primary.main",
                  border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.3)}`,
                }}
              />
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="overline" fontWeight={700} color="text.secondary">
              Sub Roles
            </Typography>
            {selectedSubRoles.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {selectedSubRoles.map((r) => (
                  <Chip
                    key={r}
                    icon={<span style={{ fontSize: 15 }}>{roleIcons[r]}</span>}
                    label={roleLabel(r)}
                    onDelete={() => handleRemoveRole(r)}
                    deleteIcon={<MdDelete />}
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1.5,
                      bgcolor: "background.paper",
                      border: (t) => `1px solid ${t.palette.divider}`,
                    }}
                  />
                ))}
              </Stack>
            ) : (
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  borderRadius: 2,
                  textAlign: "center",
                  bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
                  border: (t) => `1px dashed ${t.palette.divider}`,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No sub-roles assigned.
                </Typography>
              </Box>
            )}
          </Box>

          <Box>
            <Typography variant="overline" fontWeight={700} color="text.secondary">
              Add Sub-Role
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Select a role</InputLabel>
                <Select
                  label="Select a role"
                  value={tempRole}
                  onChange={(e) => setTempRole(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  {allRoles
                    .filter((r) => r !== role && !selectedSubRoles.includes(r)) // Exclude main role & already selected ones
                    .map((r) => (
                      <MenuItem key={r} value={r}>
                        {roleIcons[r]} {roleLabel(r)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<MdAddCircleOutline />}
                onClick={handleAddRole}
                disabled={!tempRole}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Add Role
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
