"use client";

// Create an update for a lead — migrated from the legacy CreateUpdateModal. POST
// /v2/updates/:clientLeadId?department=<main>  body { title, description, sharedDepartments }.
// The department-share selection logic (ADMIN is exclusive; the main/current department is
// always included) is preserved. Gated on PERMISSIONS.UPDATE.CREATE at the call site.

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdAdd } from "react-icons/md";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { DEPARTMENTS } from "../../config/projectsConstants.js";
import { projectsService } from "../../projects.service.js";
import { runProjectMutation } from "../../projects.mutations.js";

function isAdminUser(user) {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || Boolean(user?.isSuperSales);
}

export function CreateUpdateModal({ clientLeadId, onCreated, currentUserDepartment = "STAFF" }) {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sharedDepartments, setSharedDepartments] = useState([]);
  const [department, setDepartment] = useState(currentUserDepartment);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setSharedDepartments(currentUserDepartment ? [currentUserDepartment] : []);
      setDepartment(currentUserDepartment);
      setError("");
    }
  }, [open, currentUserDepartment]);

  const toggleDept = (dept) => {
    if (dept === department) return;
    if (dept === currentUserDepartment && !isAdmin) return;
    if (dept === "ADMIN") {
      setSharedDepartments((prev) => {
        if (prev.includes("ADMIN")) return prev.filter((d) => d !== "ADMIN");
        const mainDept = department || currentUserDepartment;
        setError("عند اختيار الإدارة لا يمكن المشاركة مع أي قسم آخر");
        return mainDept ? ["ADMIN", mainDept] : ["ADMIN"];
      });
      return;
    }
    if (sharedDepartments.includes("ADMIN")) {
      setError("يجب إلغاء اختيار الإدارة للمشاركة مع أقسام أخرى");
      return;
    }
    setSharedDepartments((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept],
    );
  };

  const handleMainDepartmentChange = (value) => {
    setDepartment(value);
    setSharedDepartments((prev) => (prev.includes(value) ? prev : [...prev, value]));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("العنوان مطلوب");
      return;
    }
    if (sharedDepartments.length === 0) {
      setError("يجب اختيار قسم واحد على الأقل");
      return;
    }
    const res = await runProjectMutation(
      () =>
        projectsService.createUpdate(
          clientLeadId,
          { title, description, sharedDepartments },
          { department },
        ),
      { loading: "جاري الإنشاء...", setLoading: setSubmitting },
    );
    if (res) {
      onCreated?.(res.data);
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="contained" startIcon={<MdAdd />} onClick={() => setOpen(true)} sx={{ borderRadius: 2 }}>
        إنشاء تحديث
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>تحديث جديد</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="العنوان" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth required />
            <TextField
              label="الوصف"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            {isAdmin && (
              <>
                <FormControl fullWidth>
                  <InputLabel>القسم الرئيسي</InputLabel>
                  <Select
                    value={department || ""}
                    onChange={(e) => handleMainDepartmentChange(e.target.value)}
                    label="القسم الرئيسي"
                  >
                    {DEPARTMENTS.filter((d) => !(d.value === "ADMIN" && isAdmin)).map((dept) => (
                      <MenuItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Divider />
              </>
            )}

            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                الأقسام المشاركة
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
              <Stack>
                {DEPARTMENTS.filter((d) => !(d.value === "ADMIN" && isAdmin)).map((dept) => {
                  const isChecked = sharedDepartments.includes(dept.value);
                  const isDisabled =
                    (dept.value === currentUserDepartment && !isAdmin) || dept.value === department;
                  return (
                    <FormControlLabel
                      key={dept.value}
                      control={
                        <Checkbox
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => toggleDept(dept.value)}
                        />
                      }
                      label={dept.label}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} disabled={submitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
            إنشاء التحديث
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default CreateUpdateModal;
