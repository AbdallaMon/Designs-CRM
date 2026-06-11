"use client";

// Learner course detail (STAFF) — STAFF_COURSE.VIEW. Shows the course header + its lesson list
// (getCourse → course.lessons) and the caller's progress (getProgress). Each lesson links to the
// lesson player (/v2/my-courses/[courseId]/lessons/[lessonId]); completed lessons are marked.
// Lesson-access/previous-lesson gates are enforced SERVER-SIDE — the FE renders the list and the
// server rejects a locked lesson on open. All five read-states wired. Arabic / RTL.

import { Box, Container, Chip, LinearProgress, List, ListItemButton, Stack, Typography } from "@mui/material";
import { MdCheckCircle, MdPlayCircleOutline, MdLockOutline } from "react-icons/md";
import Link from "next/link";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PageHeader,
  SectionCard,
  PartialPermissionState,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/app/v2/shared/components";
import { staffCoursesService } from "../../staffCourses.service.js";
import { coursesMessages } from "../../config/coursesMessages.js";
import { useLazyResource } from "../../hooks/useLazyResource.js";

const P = PERMISSIONS.STAFF_COURSE;

export function LearnerCoursePage({ courseId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  const courseRes = useLazyResource(() => staffCoursesService.getCourse(courseId), {
    autoFetch: canView,
    deps: [courseId],
  });
  const progressRes = useLazyResource(() => staffCoursesService.getProgress(courseId), {
    autoFetch: canView,
    deps: [courseId],
  });

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState denied title="الدورة غير متاحة لصلاحياتك" />
      </Container>
    );
  }

  const course = courseRes.data;
  const lessons = course?.lessons ?? [];
  const progress = progressRes.data;
  const percent = progress?.progressPercent ?? progress?.percent ?? null;
  const completedIds = new Set(
    (progress?.completedLessons ?? []).map((c) => Number(c.lessonId ?? c.id ?? c)),
  );

  const headerTitle = course?.title ?? `دورة #${courseId}`;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title={headerTitle}
        subtitle={course?.description}
        breadcrumbs={[
          { label: "التعلّم" },
          { label: "دوراتي", href: "/v2/my-courses" },
          { label: headerTitle },
        ]}
      />

      {percent != null && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress variant="determinate" value={Math.min(100, Number(percent))} sx={{ borderRadius: 1, height: 8 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            تقدّمك: {Math.round(Number(percent))}%
          </Typography>
        </Box>
      )}

      <SectionCard title="الدروس" noPadding>
        {courseRes.error ? (
          <Box sx={{ p: 2 }}>
            <ErrorState error={courseRes.error} onRetry={courseRes.refetch} resolver={coursesMessages} />
          </Box>
        ) : courseRes.isLoading ? (
          <Box sx={{ p: 2 }}>
            <LoadingState variant="form" fields={4} />
          </Box>
        ) : lessons.length === 0 ? (
          <EmptyState title="لا توجد دروس في هذه الدورة بعد" />
        ) : (
          <List disablePadding>
            {lessons.map((lesson) => {
              const done = completedIds.has(Number(lesson.id));
              const locked = lesson.locked === true; // server may flag; default unlocked
              return (
                <ListItemButton
                  key={lesson.id}
                  component={Link}
                  href={`/v2/my-courses/${courseId}/lessons/${lesson.id}`}
                  divider
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
                    <Box sx={{ fontSize: 22, color: done ? "success.main" : locked ? "text.disabled" : "primary.main", display: "flex" }}>
                      {done ? <MdCheckCircle /> : locked ? <MdLockOutline /> : <MdPlayCircleOutline />}
                    </Box>
                    <Typography sx={{ flexGrow: 1 }}>
                      {lesson.order != null ? `${lesson.order}. ` : ""}
                      {lesson.title ?? `درس #${lesson.id}`}
                    </Typography>
                    {done && <Chip size="small" color="success" label="مكتمل" />}
                  </Stack>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </SectionCard>
    </Container>
  );
}

export default LearnerCoursePage;
