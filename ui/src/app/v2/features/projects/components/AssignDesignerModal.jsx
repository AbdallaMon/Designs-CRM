"use client";

// Assign / remove a designer on a project. Migrated from the legacy AssignDesignerModal
// (UiComponents/.../projects/AssignDesignerModal.jsx) — same fields/behavior:
//  • fetches the candidate users for the project's role
//  • for a 3D_Designer project, offers the add/remove-to-modification toggle
//  • POST /v2/projects/:id/actions/assign-designer (§5c: was PUT /:id/assign-designer)
//
// Gated by the row's capabilities.canAssignDesigner × PERMISSIONS.PROJECT.MANAGE at the
// call site. The users pick-list is fetched from /v2/users/all-users?role= (gated
// user.list) — if the caller lacks user.list the select is empty and assign is disabled.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import apiFetch from "@/app/v2/lib/api/ApiFetch";
import { projectsService } from "../projects.service.js";
import { runProjectMutation } from "../projects.mutations.js";

export function AssignDesignerModal({
  open,
  setOpen,
  project,
  onUpdated,
  assignmentId,
  deleteDesigner,
}) {
  const [designerId, setDesignerId] = useState("");
  const [users, setUsers] = useState([]);
  const [addToModification, setAddToModification] = useState(true);
  const [removeFromModification, setRemoveFromModification] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isThreeDDesigner = project?.type === "3D_Designer";

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const res = await apiFetch.get(`users/all-users?role=${project.role}&`);
        if (active) setUsers(Array.isArray(res?.data?.items) ? res.data.items : []);
      } catch {
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, project?.role]);

  useEffect(() => {
    if (open) {
      setAddToModification(true);
      setRemoveFromModification(true);
      setDesignerId("");
    }
  }, [open]);

  const handleSubmit = async () => {
    const body = {
      designerId: deleteDesigner ? undefined : designerId,
      assignmentId,
      deleteDesigner,
      groupId: project.groupId,
      ...(isThreeDDesigner && {
        addToModification: deleteDesigner ? undefined : addToModification,
        removeFromModification: deleteDesigner ? removeFromModification : undefined,
      }),
    };
    const res = await runProjectMutation(() => projectsService.assignDesigner(project.id, body), {
      loading: deleteDesigner ? "جاري إزالة المصمم..." : "جاري تعيين المصمم...",
      setLoading: setSubmitting,
    });
    if (res) {
      onUpdated?.(res.data);
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
      slotProps={{ paper: { sx: { width: "400px", maxWidth: "100%" } } }}
    >
      <DialogTitle>{deleteDesigner ? "إزالة المصمم" : "تعيين مصمم"}</DialogTitle>
      <DialogContent>
        {deleteDesigner ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              هل أنت متأكد من إزالة المصمم من هذا المشروع؟
            </Typography>
            {isThreeDDesigner && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={removeFromModification}
                    onChange={(e) => setRemoveFromModification(e.target.checked)}
                    color="primary"
                  />
                }
                label="إزالة المستخدم من جزء التعديل أيضاً"
              />
            )}
          </>
        ) : (
          <>
            <FormControl fullWidth sx={{ mt: 1, mb: isThreeDDesigner ? 2 : 0 }}>
              <InputLabel id="designer-label">اختر مصمماً</InputLabel>
              <Select
                labelId="designer-label"
                value={designerId}
                label="اختر مصمماً"
                onChange={(e) => setDesignerId(e.target.value)}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name} - {u.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {isThreeDDesigner && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={addToModification}
                    onChange={(e) => setAddToModification(e.target.checked)}
                    color="primary"
                  />
                }
                label="إضافة المستخدم إلى جزء التعديل"
              />
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={submitting}>
          إلغاء
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={deleteDesigner ? "error" : "primary"}
          disabled={submitting || (!deleteDesigner && !designerId)}
        >
          {deleteDesigner ? "إزالة" : "تعيين"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AssignDesignerModal;
