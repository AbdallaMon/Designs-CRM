"use client";

// Create / edit test modal — local state form. Create body: { testType?, attemptLimit?,
// timeLimit?, title?, published? }; edit body(.strict): { title?, type?, attemptLimit?,
// timeLimit?, published?, certificateApprovedByAdmin? }. Submits via coursesService.createTest
// ({key,id}) / .updateTest through runCoursesMutation. Gated at the call site on COURSE.MANAGE.
// Arabic / RTL.

import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";
import { TEST_TYPE_OPTIONS } from "@/app/v2/features/courses/config/coursesConstants.js";

function toForm(test) {
  return {
    title: test?.title ?? "",
    type: test?.type ?? "LESSON",
    attemptLimit: test?.attemptLimit ?? 2,
    timeLimit: test?.timeLimit ?? "",
    published: Boolean(test?.published),
  };
}

export function TestFormDialog({ open, onClose, owner, test, onSaved }) {
  // owner = { key: "courseId"|"lessonId", id } — only used on CREATE.
  const isEdit = Boolean(test?.id);
  const [form, setForm] = useState(toForm(test));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(toForm(test));
  }, [test, open]);

  function set(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit() {
    const common = {
      title: form.title?.trim() || undefined,
      attemptLimit: form.attemptLimit !== "" ? Number(form.attemptLimit) : undefined,
      timeLimit: form.timeLimit !== "" ? Number(form.timeLimit) : undefined,
      published: Boolean(form.published),
    };
    const res = await runCoursesMutation(
      () =>
        isEdit
          ? coursesService.updateTest(test.id, { ...common, type: form.type })
          : coursesService.createTest(owner, { ...common, testType: form.type }),
      { loading: isEdit ? "جاري تحديث الاختبار..." : "جاري إنشاء الاختبار...", setLoading: setSubmitting },
    );
    if (res) {
      onSaved?.(res.data);
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        {isEdit ? "تعديل الاختبار" : "إنشاء اختبار"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField label="عنوان الاختبار (اختياري)" value={form.title} onChange={(e) => set("title", e.target.value)} fullWidth />
          <TextField select label="نوع الاختبار" value={form.type} onChange={(e) => set("type", e.target.value)} fullWidth>
            {TEST_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField
              type="number"
              label="عدد المحاولات"
              value={form.attemptLimit}
              onChange={(e) => set("attemptLimit", e.target.value)}
              fullWidth
            />
            <TextField
              type="number"
              label="المدة (دقائق، اختياري)"
              value={form.timeLimit}
              onChange={(e) => set("timeLimit", e.target.value)}
              fullWidth
            />
          </Stack>
          <FormControlLabel
            control={<Checkbox checked={Boolean(form.published)} onChange={(e) => set("published", e.target.checked)} />}
            label="نشر الاختبار"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} variant="outlined" disabled={submitting}>
          إلغاء
        </Button>
        <Button onClick={submit} variant="contained" color="primary" disabled={submitting}>
          {isEdit ? "حفظ" : "إنشاء"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TestFormDialog;
