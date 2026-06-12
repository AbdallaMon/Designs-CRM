"use client";

// Course detail (ADMIN authoring) — opens a course and shows its lessons. Reads
// GET /v2/courses/:courseId/lessons → { lessons:[{ id, title, order, duration, isPreviewable,
// mustUploadHomework, videos[], pdfs[], links[], _count:{tests} }], courseTitle }. Supports
// add / edit / delete lesson (COURSE.MANAGE) via LessonFormDialog + coursesService. Per-lesson
// content counts (videos/pdfs/links/tests) are surfaced read-only; the full content editors are
// a later UX phase (the data layer for them already exists in courses.service.js). Single-
// language Arabic, RTL.

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdAdd, MdDelete, MdEdit, MdClose } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { coursesService } from "../courses.service.js";
import { runCoursesMutation } from "../courses.mutations.js";
import { LessonFormDialog } from "./LessonFormDialog.jsx";

export function CourseLessonsDialog({ open, onClose, course, onChanged }) {
  const courseId = course?.id;
  const { hasPermission } = usePermission();
  const canManage = hasPermission(PERMISSIONS.COURSE.MANAGE);
  const { setLoading } = useToastContext();

  const [lessons, setLessons] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [loading, setLoadingLessons] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchLessons = useCallback(async () => {
    if (!courseId) return;
    setLoadingLessons(true);
    try {
      const res = await coursesService.listLessons(courseId);
      const data = res?.data ?? {};
      setLessons(Array.isArray(data.lessons) ? data.lessons : []);
      setCourseTitle(data.courseTitle ?? course?.title ?? "");
    } catch {
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  }, [courseId, course?.title]);

  useEffect(() => {
    if (open) fetchLessons();
  }, [open, fetchLessons]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(lesson) {
    setEditing(lesson);
    setFormOpen(true);
  }

  async function handleDelete(lesson) {
    if (!window.confirm(`حذف الدرس "${lesson.title}"؟`)) return;
    const res = await runCoursesMutation(
      () => coursesService.deleteLesson(courseId, lesson.id),
      { setLoading, loading: "جاري حذف الدرس..." },
    );
    if (res) {
      fetchLessons();
      onChanged?.();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">دروس الدورة — {courseTitle || course?.title || ""}</Typography>
          <IconButton onClick={onClose} size="small">
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {canManage && (
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<MdAdd />} onClick={openCreate}>
              إضافة درس
            </Button>
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : lessons.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            لا توجد دروس بعد
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>الترتيب</TableCell>
                  <TableCell>العنوان</TableCell>
                  <TableCell>المحتوى</TableCell>
                  <TableCell>الخصائص</TableCell>
                  {canManage && <TableCell align="left">إجراءات</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {lessons.map((lesson) => (
                  <TableRow key={lesson.id} hover>
                    <TableCell>{lesson.order ?? "-"}</TableCell>
                    <TableCell>{lesson.title}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                        <Chip size="small" label={`فيديو: ${lesson.videos?.length ?? 0}`} />
                        <Chip size="small" label={`ملفات: ${lesson.pdfs?.length ?? 0}`} />
                        <Chip size="small" label={`روابط: ${lesson.links?.length ?? 0}`} />
                        <Chip size="small" label={`اختبارات: ${lesson._count?.tests ?? 0}`} />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                        {lesson.isPreviewable && <Chip size="small" color="info" label="معاينة" />}
                        {lesson.mustUploadHomework && (
                          <Chip size="small" color="warning" label="واجب مطلوب" />
                        )}
                      </Stack>
                    </TableCell>
                    {canManage && (
                      <TableCell align="left">
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="تعديل">
                            <IconButton size="small" onClick={() => openEdit(lesson)}>
                              <MdEdit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف">
                            <IconButton size="small" color="error" onClick={() => handleDelete(lesson)}>
                              <MdDelete />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      {canManage && (
        <LessonFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          courseId={courseId}
          lesson={editing}
          onSaved={() => {
            fetchLessons();
            onChanged?.();
          }}
        />
      )}
    </Dialog>
  );
}

export default CourseLessonsDialog;
