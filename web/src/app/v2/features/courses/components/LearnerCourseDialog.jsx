"use client";

// Learner course detail (STAFF). Opens an enrolled/available course and shows its lessons +
// the caller's progress, lets the learner open a lesson to view its content (videos / pdfs /
// links) and mark it complete. All reads/writes go through staffCoursesService against
// /v2/staff-courses/*; the server enforces object-level access (published flag + CourseRole +
// LessonAccess + previous-lessons gate). When the BE denies a lesson it returns a 403 CODE we
// resolve to Arabic and show inline — we never re-implement the gate on the client.
//
// Shapes:
//   getCourse(:id?role) → { ...course, lessons:[{ id, title, order, isPreviewable, tests:[{id,
//     title, timeLimit, attempts[]}], allowedUsers[] }], tests[], _count:{lessons,tests}, capabilities }
//   getProgress(:id)    → { completedLessons:[lessonId], completedTests:[testId], testAttempts[] }
//   getLesson(:c,:l?role) → lesson detail incl. videos[{pdfs[]}], pdfs[], links[]
//   markLessonComplete(:c,:l) → POST .../actions/complete   [staff_course.take]
//
// Gating: read on STAFF_COURSE.VIEW; mark-complete on STAFF_COURSE.TAKE × capabilities.canTake.
// Single-language Arabic, RTL.

import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { MdCheckCircle, MdClose, MdExpandMore, MdLock } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { staffCoursesService } from "../staffCourses.service.js";
import { runCoursesMutation } from "../courses.mutations.js";
import { resolveCoursesMessage } from "../config/coursesMessages.js";

const P = PERMISSIONS.STAFF_COURSE;

export function LearnerCourseDialog({ open, onClose, courseId, role, onChanged }) {
  const { hasPermission } = usePermission();
  const canTakeCode = hasPermission(P.TAKE);
  const { setLoading } = useToastContext();

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoadingCourse] = useState(false);

  // Per-lesson content cache + per-lesson inline error (e.g. BE 403 lesson-access gate).
  const [lessonContent, setLessonContent] = useState({});
  const [lessonError, setLessonError] = useState({});
  const [lessonLoading, setLessonLoading] = useState({});

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    setLoadingCourse(true);
    try {
      const [courseRes, progressRes] = await Promise.all([
        staffCoursesService.getCourse(courseId, { role }),
        staffCoursesService.getProgress(courseId),
      ]);
      setCourse(courseRes?.data ?? null);
      setProgress(progressRes?.data ?? null);
    } catch {
      setCourse(null);
      setProgress(null);
    } finally {
      setLoadingCourse(false);
    }
  }, [courseId, role]);

  useEffect(() => {
    if (open) {
      setLessonContent({});
      setLessonError({});
      fetchCourse();
    }
  }, [open, fetchCourse]);

  const completedLessonIds = progress?.completedLessons ?? [];
  const isLessonDone = (lessonId) => completedLessonIds.includes(lessonId);
  const canTake = canTakeCode && (course?.capabilities?.canTake ?? true);

  const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
  const totalLessons = course?._count?.lessons ?? lessons.length;
  const completionPct =
    totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

  // Lazy-load a lesson's content the first time its accordion expands. The server applies the
  // lesson-access / previous-lessons gate; a 403 surfaces as an inline Arabic alert.
  async function loadLessonContent(lessonId) {
    if (lessonContent[lessonId] || lessonLoading[lessonId]) return;
    setLessonLoading((s) => ({ ...s, [lessonId]: true }));
    setLessonError((s) => ({ ...s, [lessonId]: null }));
    try {
      const res = await staffCoursesService.getLesson(courseId, lessonId, { role });
      setLessonContent((s) => ({ ...s, [lessonId]: res?.data ?? {} }));
    } catch (e) {
      const code = e?.data?.message || e?.message;
      setLessonError((s) => ({
        ...s,
        [lessonId]: resolveCoursesMessage(code, { fallback: "تعذّر فتح هذا الدرس" }),
      }));
    } finally {
      setLessonLoading((s) => ({ ...s, [lessonId]: false }));
    }
  }

  async function handleComplete(lessonId) {
    const res = await runCoursesMutation(
      () => staffCoursesService.markLessonComplete(courseId, lessonId),
      { setLoading, loading: "جاري تسجيل إكمال الدرس..." },
    );
    if (res) {
      fetchCourse();
      onChanged?.();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">{course?.title || "تفاصيل الدورة"}</Typography>
          <IconButton onClick={onClose} size="small">
            <MdClose />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !course ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            لا تملك صلاحية الوصول إلى هذه الدورة أو أنها غير متاحة
          </Typography>
        ) : (
          <Stack spacing={2}>
            {course.description && (
              <Typography variant="body2" color="text.secondary">
                {course.description}
              </Typography>
            )}

            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                <Typography variant="body2">
                  التقدم: {completedLessonIds.length} / {totalLessons} دروس
                </Typography>
                <Typography variant="body2" color="primary">
                  ({completionPct}%)
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={completionPct} />
            </Box>

            {lessons.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                لا توجد دروس متاحة للمعاينة
              </Typography>
            ) : (
              lessons.map((lesson) => {
                const done = isLessonDone(lesson.id);
                const content = lessonContent[lesson.id];
                return (
                  <Accordion
                    key={lesson.id}
                    onChange={(_e, expanded) => expanded && loadLessonContent(lesson.id)}
                  >
                    <AccordionSummary expandIcon={<MdExpandMore />}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
                        {done ? (
                          <MdCheckCircle color="green" />
                        ) : (
                          <MdLock color="#999" />
                        )}
                        <Typography sx={{ flex: 1 }}>
                          {lesson.order ? `${lesson.order}. ` : ""}
                          {lesson.title}
                        </Typography>
                        {done && <Chip size="small" color="success" label="مكتمل" />}
                        {lesson._count?.tests > 0 && (
                          <Chip size="small" variant="outlined" label={`اختبارات: ${lesson._count.tests}`} />
                        )}
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      {lessonLoading[lesson.id] ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                          <CircularProgress size={22} />
                        </Box>
                      ) : lessonError[lesson.id] ? (
                        <Alert severity="warning">{lessonError[lesson.id]}</Alert>
                      ) : content ? (
                        <Stack spacing={1.5}>
                          <LessonContentBlock title="الفيديوهات" items={content.videos} render={(v) => v.url} />
                          <LessonContentBlock title="الملفات" items={content.pdfs} render={(p) => p.url} />
                          <LessonContentBlock
                            title="الروابط"
                            items={content.links}
                            render={(l) => l.url}
                            label={(l) => l.title}
                          />
                          {canTake && (
                            <Box>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<MdCheckCircle />}
                                disabled={done}
                                onClick={() => handleComplete(lesson.id)}
                              >
                                {done ? "تم الإكمال" : "تحديد كمكتمل"}
                              </Button>
                            </Box>
                          )}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          افتح الدرس لعرض المحتوى
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Small list block for a lesson's content items (videos / pdfs / links). Empty → omitted.
function LessonContentBlock({ title, items, render, label }) {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return null;
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        {title}
      </Typography>
      <List dense disablePadding>
        {list.map((item) => (
          <ListItem key={item.id} disableGutters>
            <ListItemText
              primary={
                <MuiLink href={render(item)} target="_blank" rel="noopener noreferrer">
                  {label ? label(item) || render(item) : render(item)}
                </MuiLink>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default LearnerCourseDialog;
