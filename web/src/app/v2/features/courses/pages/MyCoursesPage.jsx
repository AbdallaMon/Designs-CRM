"use client";

// My Courses — STAFF learner view (route /v2/my-courses, backend /v2/staff-courses/*). Real
// screen: lists the courses visible to the signed-in user (published + matching their
// CourseRole), each as a card with the caller's completion progress, and opens a course to view
// its lessons/content and mark lessons complete (LearnerCourseDialog). The data layer
// (staffCoursesService) is the only thing that talks to the API.
//
// `role` is a CLIENT-supplied CONTENT filter (the CourseRole to match) — NOT an authz input. We
// pass the signed-in user's role (useAuth) so the list returns the courses meant for them, which
// is what the legacy learner screen did. Object-level access is enforced SERVER-SIDE.
//
// Two reads, merged by course id:
//   • staffCoursesService.list({ role })  → data.items[] (visible courses + _count)
//   • staffCoursesService.getDashboard()  → courseProgress[] (completionPercentage per enrolled course)
// Gating (shared-permissions §7): browse on PERMISSIONS.STAFF_COURSE.VIEW. Single-language Arabic, RTL.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdMenuBook, MdRefresh } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useAuth } from "@/app/v2/providers/AuthProvider";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { staffCoursesService } from "../staffCourses.service.js";
import { LearnerCourseDialog } from "../components/LearnerCourseDialog.jsx";

const P = PERMISSIONS.STAFF_COURSE;

export function MyCoursesPage() {
  const { hasPermission } = usePermission();
  const { user } = useAuth();
  const canView = hasPermission(P.VIEW);
  const role = user?.role || undefined;

  const [items, setItems] = useState([]);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [openCourseId, setOpenCourseId] = useState(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, dashRes] = await Promise.all([
        staffCoursesService.list({ page: 1, limit: 50, role }),
        // The dashboard read can legitimately be empty for a brand-new learner; tolerate failure.
        staffCoursesService.getDashboard().catch(() => null),
      ]);
      const data = listRes?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);

      const courseProgress = dashRes?.data?.courseProgress ?? [];
      const map = {};
      for (const cp of courseProgress) map[cp.id] = cp;
      setProgressByCourse(map);
    } catch {
      setItems([]);
      setProgressByCourse({});
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (canView) fetchCourses();
  }, [canView, fetchCourses]);

  const openCourse = useMemo(
    () => items.find((c) => c.id === openCourseId) || null,
    [items, openCourseId],
  );

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى الدورات</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5">دوراتي</Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="تحديث">
          <IconButton onClick={fetchCourses}>
            <MdRefresh />
          </IconButton>
        </Tooltip>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography color="text.secondary">لا توجد دورات متاحة لك حالياً</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((course) => {
            const cp = progressByCourse[course.id];
            const pct =
              cp?.completionPercentage != null ? Math.round(cp.completionPercentage) : null;
            const totalLessons = course._count?.lessons ?? cp?.totalLessons ?? 0;
            return (
              <Grid key={course.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                  <CardActionArea
                    onClick={() => setOpenCourseId(course.id)}
                    sx={{ height: "100%", alignItems: "stretch" }}
                  >
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                        <MdMenuBook />
                        <Typography variant="h6" sx={{ flex: 1 }}>
                          {course.title || `دورة #${course.id}`}
                        </Typography>
                      </Stack>
                      {course.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {course.description}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}>
                        <Chip size="small" label={`دروس: ${totalLessons}`} />
                        <Chip size="small" label={`اختبارات: ${course._count?.tests ?? 0}`} />
                        {pct === 100 && <Chip size="small" color="success" label="مكتملة" />}
                      </Stack>
                      {pct != null ? (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            التقدم: {pct}%
                          </Typography>
                          <LinearProgress variant="determinate" value={pct} sx={{ mt: 0.5 }} />
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          لم تبدأ بعد
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <LearnerCourseDialog
        open={Boolean(openCourseId)}
        onClose={() => setOpenCourseId(null)}
        courseId={openCourseId}
        role={role}
        onChanged={fetchCourses}
      />
    </Container>
  );
}

export default MyCoursesPage;
