"use client";

// Create / edit lesson modal — RHF (Controller + MUI). Body mirrors the BE .strict() schema:
// { title?, description?, duration?, order?, isPreviewable?, mustUploadHomework? }. Submits via
// coursesService.createLesson / .updateLesson through runCoursesMutation. Gated at the call site
// on COURSE.MANAGE. Single-language Arabic / RTL.

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";

const DEFAULTS = {
  title: "",
  description: "",
  duration: "",
  order: "",
  isPreviewable: false,
  mustUploadHomework: true,
};

function toForm(lesson) {
  if (!lesson) return DEFAULTS;
  return {
    title: lesson.title ?? "",
    description: lesson.description ?? "",
    duration: lesson.duration ?? "",
    order: lesson.order ?? "",
    isPreviewable: Boolean(lesson.isPreviewable),
    mustUploadHomework: lesson.mustUploadHomework ?? true,
  };
}

export function LessonFormDialog({ open, onClose, courseId, lesson, onSaved }) {
  const isEdit = Boolean(lesson?.id);
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit, reset } = useForm({ defaultValues: toForm(lesson) });

  useEffect(() => {
    reset(toForm(lesson));
  }, [lesson, open, reset]);

  function close() {
    reset(toForm(lesson));
    onClose?.();
  }

  async function onSubmit(values) {
    const body = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      duration: values.duration !== "" ? Number(values.duration) : undefined,
      order: values.order !== "" ? Number(values.order) : undefined,
      isPreviewable: Boolean(values.isPreviewable),
      mustUploadHomework: Boolean(values.mustUploadHomework),
    };
    const res = await runCoursesMutation(
      () =>
        isEdit
          ? coursesService.updateLesson(courseId, lesson.id, body)
          : coursesService.createLesson(courseId, body),
      { loading: isEdit ? "جاري تحديث الدرس..." : "جاري إنشاء الدرس...", setLoading: setSubmitting },
    );
    if (res) {
      onSaved?.(res.data);
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        {isEdit ? "تعديل الدرس" : "إنشاء درس"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "عنوان الدرس مطلوب" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="عنوان الدرس"
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
                <TextField {...field} label="وصف الدرس (اختياري)" fullWidth multiline minRows={2} />
              )}
            />
            <Stack direction="row" spacing={2}>
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" label="المدة (دقائق)" fullWidth />
                )}
              />
              <Controller
                name="order"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" label="الترتيب" fullWidth />
                )}
              />
            </Stack>
            <Controller
              name="isPreviewable"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label="درس تجريبي (مرئي بدون اشتراط الدروس السابقة)"
                />
              )}
            />
            <Controller
              name="mustUploadHomework"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                  }
                  label="يتطلّب رفع واجب لإكمال الدرس"
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

export default LessonFormDialog;
