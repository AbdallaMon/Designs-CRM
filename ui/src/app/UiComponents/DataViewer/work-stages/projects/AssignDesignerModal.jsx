"use client";

import { getData } from "@/app/helpers/functions/getData";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useEffect, useState } from "react";

export function AssignDesignerModal({
  open,
  setOpen,
  project,
  onUpdate,
  assignmentId,
  deleteDesigner,
}) {
  const [designerId, setDesignerId] = useState("");
  const [users, setUsers] = useState([]);
  const [addToModification, setAddToModification] = useState(true);
  const [removeFromModification, setRemoveFromModification] = useState(true);
  const { setLoading: setToastLoading } = useToastContext();
  const [loading, setLoading] = useState(true);

  const isThreeDDesigner = project.type === "3D_Designer";

  useEffect(() => {
    async function getUsers() {
      const usersRequest = await getData({
        url: `admin/all-users?role=${project.role}&`,
        setLoading,
      });
      if (usersRequest.status === 200) {
        setUsers(usersRequest.data);
      }
    }
    if (open) {
      getUsers();
    }
  }, [open, project.role]);

  useEffect(() => {
    if (open) {
      setAddToModification(true);
      setRemoveFromModification(true);
    }
  }, [open]);

  const handleDesignerChange = (event) => {
    setDesignerId(event.target.value);
  };

  const handleAddToModificationChange = (event) => {
    setAddToModification(event.target.checked);
  };

  const handleRemoveFromModificationChange = (event) => {
    setRemoveFromModification(event.target.checked);
  };

  const handleSubmit = async () => {
    const requestData = {
      designerId,
      assignmentId,
      deleteDesigner,
      groupId: project.groupId,
      ...(isThreeDDesigner && {
        addToModification: deleteDesigner ? undefined : addToModification,
        removeFromModification: deleteDesigner
          ? removeFromModification
          : undefined,
      }),
    };

    const updatedProject = await handleRequestSubmit(
      requestData,
      setToastLoading,
      `shared/projects/${project.id}/assign-designer`,
      false,
      deleteDesigner ? "Removing Designer" : "Assigning Designer",
      false,
      "PUT"
    );

    if (updatedProject.status === 200) {
      if (isThreeDDesigner) {
        window.location.reload();
      }
      onUpdate(updatedProject.data);
      setOpen(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{ sx: { width: "400px", maxWidth: "100%" } }}
    >
      <DialogTitle>
        {deleteDesigner ? "Remove Designer" : "Assign Designer"}
      </DialogTitle>
      <DialogContent>
        <>
          {deleteDesigner ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Are you sure you want to remove the designer from this project?
              </Typography>

              {isThreeDDesigner && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={removeFromModification}
                      onChange={handleRemoveFromModificationChange}
                      color="primary"
                    />
                  }
                  label="Also remove user from modification part"
                />
              )}
            </>
          ) : (
            <>
              <FormControl
                fullWidth
                sx={{ mt: 1, mb: isThreeDDesigner ? 2 : 0 }}
              >
                <InputLabel id="designer-label">Select Designer</InputLabel>
                <Select
                  labelId="designer-label"
                  value={designerId}
                  label="Select Designer"
                  onChange={handleDesignerChange}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {isThreeDDesigner && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addToModification}
                      onChange={handleAddToModificationChange}
                      color="primary"
                    />
                  }
                  label="Add user to modification part"
                />
              )}
            </>
          )}
        </>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={deleteDesigner ? "error" : "primary"}
          disabled={!deleteDesigner && !designerId}
        >
          {deleteDesigner ? "Remove" : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
