"use client";

// Create / edit course modal — react-hook-form (Controller + MUI fields) building the EXACT BE
// body: create → { title, description?, imageUrl?, isPublished?, roles[] };
// edit (.strict) → { title?, description?, imageUrl?, isPublished?, roles? }. Submits via
// coursesService.create / .update through runCoursesMutation (envelope CODE → Arabic toast);
// on success closes + calls onSaved. Gated at the CALL SITE on PERMISSIONS.COURSE.MANAGE (the
// page does not render this when the user cannot manage). The server still enforces.
// Single-language Arabic / RTL. Mirrors features/users/components/CreateUserModal.jsx.

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { coursesService } from "../courses.service.js";
import { runCoursesMutation } from "../courses.mutations.js";
import { COURSE_ROLE_OPTIONS, resolveRoleLabel, COURSES_UI } from "../config/coursesConstants.js";

const DEFAULTS = { title: "", description: "", imageUrl: "", isPublished: false, roles: [] };

function toForm(course) {
  if (!course) return DEFAULTS;
  return {
    title: course.title ?? "",
    description: course.description ?? "",
    imageUrl: course.imageUrl ?? "",
    isPublished: Boolean(course.isPublished),
    // Course.roles is CourseRole[] ({ role }) on read; the write contract wants UserRole[] keys.
    roles: Array.isArray(course.roles)
      ? course.roles.map((r) => (typeof r === "string" ? r : r.role)).filter(Boolean)
      : [],
  };
}

export function CourseFormDialog({ open, onClose, course, onSaved }) {
  const isEdit = Boolean(course?.id);
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: toForm(course) });

  useEffect(() => {
    reset(toForm(course));
  }, [course, open, reset]);

  function close() {
    reset(toForm(course));
    onClose?.();
  }

  async function onSubmit(values) {
    const body = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
      isPublished: Boolean(values.isPublished),
      roles: values.roles ?? [],
    };
    const res = await runCoursesMutation(
      () => (isEdit ? coursesService.update(course.id, body) : coursesService.create(body)),
      {
        loading: isEdit ? "جاري تحديث الدورة..." : "جاري إنشاء الدورة...",
        setLoading: setSubmitting,
      },
    );
    if (res) {
      onSaved?.(res.data);
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        {isEdit ? COURSES_UI.editCourse : COURSES_UI.createCourse}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "عنوان الدورة مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="عنوان الدورة"
                  fullWidth
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="وصف الدورة (اختياري)" fullWidth multiline minRows={3} />
              )}
            />
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="رابط صورة الغلاف (اختياري)" fullWidth />
              )}
            />
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                الأدوار المسموح لها برؤية الدورة
              </Typography>
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    multiple
                    fullWidth
                    displayEmpty
                    renderValue={(selected) =>
                      selected.length === 0
                        ? "كل الأدوار"
                        : selected.map((r) => resolveRoleLabel(r)).join("، ")
                    }
                  >
                    {COURSE_ROLE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        <Checkbox checked={field.value?.includes(opt.value)} />
                        <ListItemText primary={opt.label} />
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Box>
            <Controller
              name="isPublished"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label="نشر الدورة (مرئية للمتعلّمين)"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={close} variant="outlined" disabled={submitting}>
            إلغاء
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={submitting}>
            {isEdit ? "حفظ" : "إنشاء"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CourseFormDialog;
