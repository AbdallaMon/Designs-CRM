import { roleIcons } from "@/app/helpers/constants";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { checkIfAdmin } from "@/app/helpers/functions/utility";
import { useAuth } from "@/app/providers/AuthProvider";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MdAddCircleOutline, MdDelete } from "react-icons/md";

export const RoleManagerDialog = ({ role, subRoles, setData, userId }) => {
  const allRoles = Object.keys(roleIcons); // Available roles
  const [open, setOpen] = useState(false);
  const [selectedSubRoles, setSelectedSubRoles] = useState([...subRoles]); // SubRoles state
  const [tempRole, setTempRole] = useState(""); // Temp role to add
  const { setLoading } = useToastContext();
  const { user } = useAuth();
  const admin = checkIfAdmin(user);
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
      <Button onClick={() => setOpen(true)} variant="contained" fullWidth>
        Manage Roles
      </Button>
    );
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage User Roles</DialogTitle>
      <DialogContent>
        <Typography variant="h6">Main Role:</Typography>
        <List>
          <ListItem>
            <ListItemIcon>{roleIcons[role]}</ListItemIcon>
            <ListItemText primary={role} />
          </ListItem>
        </List>

        <Typography variant="h6">Sub Roles:</Typography>
        <List>
          {selectedSubRoles.length > 0 ? (
            selectedSubRoles.map((r) => (
              <ListItem key={r}>
                <ListItemIcon>{roleIcons[r]}</ListItemIcon>
                <ListItemText primary={r} />
                <IconButton onClick={() => handleRemoveRole(r)} color="error">
                  <MdDelete />
                </IconButton>
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No sub-roles assigned.
            </Typography>
          )}
        </List>

        <FormControl fullWidth margin="normal">
          <InputLabel>Add Sub-Role</InputLabel>
          <Select
            value={tempRole}
            onChange={(e) => setTempRole(e.target.value)}
          >
            {allRoles
              .filter((r) => r !== role && !selectedSubRoles.includes(r)) // Exclude main role & already selected ones
              .map((r) => (
                <MenuItem key={r} value={r}>
                  {roleIcons[r]} {r}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<MdAddCircleOutline />}
          onClick={handleAddRole}
          fullWidth
          disabled={!tempRole}
        >
          Add Role
        </Button>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
