"use client";

// My Courses (STAFF learner) catalogue + progress — redesigned on the Phase-0 shared primitives
// (PageHeader + SectionCard + the five states). Replaces the foundation smoke-screen. Visibility
// gates on PERMISSIONS.STAFF_COURSE.VIEW; object-level course visibility is enforced SERVER-SIDE
// (published + role match), so the FE just renders what the list returns. A KPI tier
// (getDashboard) sits above a responsive grid of course cards, each linking to the course detail
// (/v2/my-courses/[courseId]). Arabic / RTL.

import { Box, Container, Grid, LinearProgress, Typography } from "@mui/material";
import { MdSchool, MdCheckCircle, MdTrendingUp } from "react-icons/md";
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
import { staffCoursesService } from "../staffCourses.service.js";
import { coursesMessages } from "../config/coursesMessages.js";
import { COURSES_UI } from "../config/coursesConstants.js";
import { useLearnerCoursesList } from "../learner/hooks/useLearnerCoursesList.js";
import { useLazyResource } from "../hooks/useLazyResource.js";

const P = PERMISSIONS.STAFF_COURSE;

export function MyCoursesPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  const { items, total, isLoading, error, refetch } = useLearnerCoursesList({ autoFetch: canView });
  const { data: dashboard, isLoading: dashLoading } = useLazyResource(
    () => staffCoursesService.getDashboard(),
    { autoFetch: canView, deps: [canView] },
  );

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState denied title={COURSES_UI.deniedLearner} message={COURSES_UI.deniedLearnerMsg} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title={COURSES_UI.learnerTitle}
        subtitle={`${COURSES_UI.adminSubtitlePrefix}: ${total}`}
        breadcrumbs={[{ label: "التعلّم" }, { label: COURSES_UI.learnerTitle }]}
      />

      <Box sx={{ mb: 3 }}>
        {dashLoading ? (
          <LoadingState variant="cards" count={3} columns={3} height={96} />
        ) : (
          <Grid container spacing={2}>
            <KpiCard icon={<MdSchool />} label="دوراتي" value={dashboard?.enrolledCount ?? total} />
            <KpiCard icon={<MdCheckCircle />} label="دروس مكتملة" value={dashboard?.completedLessons} />
            <KpiCard icon={<MdTrendingUp />} label="اختبارات ناجحة" value={dashboard?.passedTests} />
          </Grid>
        )}
      </Box>

      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
      ) : isLoading ? (
        <LoadingState variant="cards" count={6} columns={3} height={180} />
      ) : items.length === 0 ? (
        <EmptyState title={COURSES_UI.noLearnerCourses} description={COURSES_UI.noLearnerCoursesMsg} />
      ) : (
        <Grid container spacing={2}>
          {items.map((course) => (
            <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <CourseCard course={course} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

function KpiCard({ icon, label, value }) {
  return (
    <Grid size={{ xs: 4 }}>
      <SectionCard sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ fontSize: 26, color: "primary.main", display: "flex" }}>{icon}</Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {value ?? "—"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        </Box>
      </SectionCard>
    </Grid>
  );
}

function CourseCard({ course }) {
  const progress = course.progressPercent ?? course.progress ?? null;
  return (
    <SectionCard sx={{ height: "100%" }}>
      <Box
        component={Link}
        href={`/v2/my-courses/${course.id}`}
        sx={{ textDecoration: "none", color: "inherit", display: "block" }}
      >
        <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>
          {course.title ?? `دورة #${course.id}`}
        </Typography>
        {course.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {course.description}
          </Typography>
        )}
        {progress != null && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={Math.min(100, Number(progress))} sx={{ borderRadius: 1, height: 6 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {Math.round(Number(progress))}% — {COURSES_UI.openCourse}
            </Typography>
          </Box>
        )}
        {progress == null && (
          <Typography variant="caption" color="primary.main">
            {COURSES_UI.openCourse}
          </Typography>
        )}
      </Box>
    </SectionCard>
  );
}

export default MyCoursesPage;
