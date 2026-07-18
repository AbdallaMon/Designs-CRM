"use client";
import React from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  FormGroup,
  Checkbox,
} from "@mui/material";
import { MdEdit } from "react-icons/md";
import { ROLE_LABELS, USER_ROLES } from "@/app/helpers/constants";
import SimpleFileInput from "@/shared/components/formComponents/SimpleFileInput";

// Edit-course dialog. Controlled by the container: it owns `editForm`/`setEditForm`
// and provides `onSave`; `toastLoading` disables the save button while submitting.
export default function EditCourseDialog({
  open,
  onClose,
  editForm,
  setEditForm,
  onSave,
  toastLoading,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          Edit Course
          <FormControlLabel
            control={
              <Switch
                checked={editForm.isPublished}
                onChange={(e) =>
                  setEditForm({ ...editForm, isPublished: e.target.checked })
                }
              />
            }
            label="Published"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          label="Course Title"
          value={editForm.title}
          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Description"
          multiline
          rows={4}
          value={editForm.description}
          onChange={(e) =>
            setEditForm({ ...editForm, description: e.target.value })
          }
          margin="normal"
        />
        <SimpleFileInput
          id="file"
          setData={setEditForm}
          label={"Change banner"}
          input={{ accept: "image/*" }}
        />
        {editForm.imageUrl && (
          <Box my={1}>
            old banner:
            <img src={editForm.imageUrl} height={200} width={200} />
          </Box>
        )}
        <FormGroup sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Roles</Typography>
          <Grid container spacing={2}>
            {Object.keys(USER_ROLES).map((role) => (
              <Grid key={role} size={{ xs: 6, md: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editForm?.roles?.includes(role)}
                      onChange={(e) => {
                        const updatedRoles = e.target.checked
                          ? [...editForm.roles, role]
                          : editForm.roles.filter((r) => r !== role);
                        setEditForm({ ...editForm, roles: updatedRoles });
                      }}
                    />
                  }
                  label={ROLE_LABELS[role]}
                />
              </Grid>
            ))}
          </Grid>
        </FormGroup>
        =
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          onClick={onSave}
          variant="contained"
          disabled={toastLoading}
          startIcon={toastLoading ? <CircularProgress size={20} /> : <MdEdit />}
        >
          {toastLoading ? "Saving..." : "Save Course"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
