"use client";

// Create / edit a lesson within a course (ADMIN authoring). RHF dialog submitting the EXACT
// .strict body the BE accepts (admin-course.validation.js lessonBody):
//   create POST /v2/courses/:courseId/lessons
//   edit   PUT  /v2/courses/:courseId/lessons/:lessonId
//   → { title?, description?, duration?, order?, isPreviewable?, mustUploadHomework? }
// duration/order are coerced to numbers server-side; we send them as numbers (or omit). Writes
// route through coursesService + runCoursesMutation. Gated by the caller on COURSE.MANAGE.

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { coursesService } from "../courses.service.js";
import { runCoursesMutation } from "../courses.mutations.js";

const EMPTY = {
  title: "",
  description: "",
  duration: "",
  order: "",
  isPreviewable: false,
  mustUploadHomework: false,
};

export function LessonFormDialog({ open, onClose, courseId, lesson, onSaved }) {
  const isEdit = Boolean(lesson?.id);
  const { setLoading } = useToastContext();
  const { control, handleSubmit, reset, formState } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (!open) return;
    reset(
      isEdit
        ? {
            title: lesson.title ?? "",
            description: lesson.description ?? "",
            duration: lesson.duration ?? "",
            order: lesson.order ?? "",
            isPreviewable: Boolean(lesson.isPreviewable),
            mustUploadHomework: Boolean(lesson.mustUploadHomework),
          }
        : EMPTY,
    );
  }, [open, isEdit, lesson, reset]);

  async function onSubmit(values) {
    const body = {
      title: values.title.trim(),
      description: values.description?.trim() || null,
      isPreviewable: Boolean(values.isPreviewable),
      mustUploadHomework: Boolean(values.mustUploadHomework),
    };
    if (values.duration !== "" && values.duration != null) body.duration = Number(values.duration);
    if (values.order !== "" && values.order != null) body.order = Number(values.order);

    const res = await runCoursesMutation(
      () =>
        isEdit
          ? coursesService.updateLesson(courseId, lesson.id, body)
          : coursesService.createLesson(courseId, body),
      {
        setLoading,
        loading: isEdit ? "جاري تحديث الدرس..." : "جاري إضافة الدرس...",
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
        {isEdit ? "تعديل الدرس" : "إضافة درس"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "عنوان الدرس مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="عنوان الدرس"
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
            <Stack direction="row" spacing={2}>
              <Controller
                name="order"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="الترتيب" type="number" fullWidth />
                )}
              />
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="المدة (دقائق)" type="number" fullWidth />
                )}
              />
            </Stack>
            <Controller
              name="isPreviewable"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label="قابل للمعاينة"
                />
              )}
            />
            <Controller
              name="mustUploadHomework"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label="يتطلب رفع واجب"
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
            {isEdit ? "حفظ" : "إضافة"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default LessonFormDialog;
