"use client";

// Create / edit a course (ADMIN authoring). RHF-driven dialog mirroring the accounting
// SalaryDialog edit form + the leads modal pattern. Submits the EXACT bodies the BE Zod
// schemas accept (admin-course.validation.js):
//   create POST /v2/courses  → { title, description?, imageUrl?, isPublished?, roles[] }
//   edit   PUT  /v2/courses/:courseId (.strict) → { title?, description?, imageUrl?, isPublished?, roles? }
// Writes route through coursesService + runCoursesMutation (CODE→Arabic toast). Gated by the
// caller on PERMISSIONS.COURSE.MANAGE. Single-language Arabic, RTL.

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { coursesService } from "../courses.service.js";
import { runCoursesMutation } from "../courses.mutations.js";
import { COURSE_ROLE_OPTIONS, courseRoleLabel } from "../config/coursesColumns.js";

const EMPTY = {
  title: "",
  description: "",
  imageUrl: "",
  isPublished: false,
  roles: [],
};

export function CreateCourseDialog({ open, onClose, course, onSaved }) {
  const isEdit = Boolean(course?.id);
  const { setLoading } = useToastContext();
  const { control, handleSubmit, reset, formState } = useForm({ defaultValues: EMPTY });

  // Seed the form when (re)opening: edit → the course's current values; create → blanks.
  useEffect(() => {
    if (!open) return;
    reset(
      isEdit
        ? {
            title: course.title ?? "",
            description: course.description ?? "",
            imageUrl: course.imageUrl ?? "",
            isPublished: Boolean(course.isPublished),
            roles: Array.isArray(course.roles)
              ? course.roles.map((r) => r.role)
              : [],
          }
        : EMPTY,
    );
  }, [open, isEdit, course, reset]);

  async function onSubmit(values) {
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      imageUrl: values.imageUrl?.trim() || null,
      isPublished: Boolean(values.isPublished),
      roles: values.roles ?? [],
    };
    const res = await runCoursesMutation(
      () =>
        isEdit
          ? coursesService.update(course.id, payload)
          : coursesService.create(payload),
      {
        setLoading,
        loading: isEdit ? "جاري تحديث الدورة..." : "جاري إنشاء الدورة...",
      },
    );
    if (res) {
      onSaved?.(res.data);
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        {isEdit ? "تعديل الدورة" : "إنشاء دورة جديدة"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "العنوان مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="عنوان الدورة"
                  fullWidth
                  autoFocus
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="الوصف" fullWidth multiline minRows={2} />
              )}
            />
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="رابط الصورة" fullWidth />
              )}
            />
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="course-roles-label">الأدوار المسموح لها</InputLabel>
                  <Select
                    labelId="course-roles-label"
                    multiple
                    value={field.value ?? []}
                    onChange={(e) => field.onChange(e.target.value)}
                    input={<OutlinedInput label="الأدوار المسموح لها" />}
                    renderValue={(selected) =>
                      (selected ?? []).map(courseRoleLabel).join("، ")
                    }
                  >
                    {COURSE_ROLE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        <Checkbox checked={(field.value ?? []).includes(opt.value)} />
                        <ListItemText primary={opt.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            <Controller
              name="isPublished"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label="منشورة"
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button onClick={onClose} variant="outlined">
            إلغاء
          </Button>
          <Button type="submit" variant="contained" disabled={formState.isSubmitting}>
            {isEdit ? "حفظ" : "إنشاء"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CreateCourseDialog;
