"use client";

// Lessons tab (course editor) — lazily lists the course's lessons, supports create/edit/delete
// (COURSE.MANAGE), and expands a lesson to its nested content editor (<LessonEditor>: videos →
// video-PDFs, PDFs, links). Lessons render in an MUI accordion so authors edit one lesson's
// content in place. All five read-states wired; mutations route through runCoursesMutation
// (CODE → Arabic toast). Arabic / RTL.

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdExpandMore, MdAdd, MdEdit, MdDelete } from "react-icons/md";
import {
  SectionCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/app/v2/shared/components";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";
import { coursesMessages } from "@/app/v2/features/courses/config/coursesMessages.js";
import { useLazyResource } from "@/app/v2/features/courses/hooks/useLazyResource.js";
import { LessonFormDialog } from "../LessonFormDialog.jsx";
import { LessonEditor } from "../LessonEditor.jsx";

export function LessonsTab({ courseId, canManage }) {
  const { data, isLoading, error, refetch } = useLazyResource(
    () => coursesService.listLessons(courseId),
    { deps: [courseId] },
  );
  const [dialog, setDialog] = useState({ open: false, lesson: null });
  const [busy, setBusy] = useState(false);

  const lessons = Array.isArray(data) ? data : data?.items ?? [];

  async function deleteLesson(lesson) {
    const res = await runCoursesMutation(
      () => coursesService.deleteLesson(courseId, lesson.id),
      { loading: "جاري حذف الدرس...", setLoading: setBusy },
    );
    if (res) refetch();
  }

  return (
    <Box>
      <SectionCard
        title="دروس الدورة"
        subtitle="أضف الدروس ثم حرّر محتوى كل درس (فيديوهات، ملفات، روابط)."
        actions={
          canManage ? (
            <Button
              size="small"
              variant="contained"
              startIcon={<MdAdd />}
              onClick={() => setDialog({ open: true, lesson: null })}
            >
              إضافة درس
            </Button>
          ) : null
        }
      >
        {error ? (
          <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
        ) : isLoading ? (
          <LoadingState variant="form" fields={3} />
        ) : lessons.length === 0 ? (
          <EmptyState
            title="لا توجد دروس بعد"
            description={canManage ? "ابدأ بإضافة أول درس للدورة." : undefined}
            action={
              canManage
                ? { label: "إضافة درس", onClick: () => setDialog({ open: true, lesson: null }) }
                : undefined
            }
          />
        ) : (
          <Stack spacing={1.5}>
            {lessons.map((lesson) => (
              <Accordion key={lesson.id} disableGutters TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<MdExpandMore />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                    <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                      {lesson.order != null ? `${lesson.order}. ` : ""}
                      {lesson.title ?? `درس #${lesson.id}`}
                    </Typography>
                    {canManage && (
                      <Box onClick={(e) => e.stopPropagation()} sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="تعديل الدرس">
                          <IconButton size="small" onClick={() => setDialog({ open: true, lesson })}>
                            <MdEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف الدرس">
                          <IconButton size="small" color="error" onClick={() => deleteLesson(lesson)} disabled={busy}>
                            <MdDelete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <LessonEditor courseId={courseId} lesson={lesson} canManage={canManage} />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}
      </SectionCard>

      {canManage && (
        <LessonFormDialog
          open={dialog.open}
          courseId={courseId}
          lesson={dialog.lesson}
          onClose={() => setDialog({ open: false, lesson: null })}
          onSaved={() => {
            setDialog({ open: false, lesson: null });
            refetch();
          }}
        />
      )}
    </Box>
  );
}

export default LessonsTab;
