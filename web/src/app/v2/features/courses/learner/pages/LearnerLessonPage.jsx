"use client";

// Learner lesson PLAYER (STAFF) — STAFF_COURSE.VIEW to read, STAFF_COURSE.TAKE to act. Renders
// the lesson's videos (iframe / direct link), PDFs and links (getLesson), with:
//   • "إكمال الدرس" → markLessonComplete (no body) — gated on STAFF_COURSE.TAKE.
//   • a homework submit form (submitHomework { url, type, title? }) when the lesson requires it —
//     gated on STAFF_COURSE.TAKE; the caller's current homework is read via getHomework.
//   • links to any lesson tests (lesson.tests) → the test-taker.
// Lesson-access / previous-lesson gates are SERVER-SIDE; a locked lesson surfaces as an error
// state (resolved CODE → Arabic). All five read-states wired. Arabic / RTL.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Link as MuiLink,
  List,
  ListItem,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdCheckCircle, MdPictureAsPdf, MdLink, MdQuiz } from "react-icons/md";
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
import { runCoursesMutation } from "../../courses.mutations.js";
import { coursesMessages } from "../../config/coursesMessages.js";
import { HOMEWORK_TYPE_OPTIONS } from "../../config/coursesConstants.js";
import { useLazyResource } from "../../hooks/useLazyResource.js";

const P = PERMISSIONS.STAFF_COURSE;

export function LearnerLessonPage({ courseId, lessonId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canTake = hasPermission(P.TAKE);

  const { data: lesson, isLoading, error, refetch } = useLazyResource(
    () => staffCoursesService.getLesson(courseId, lessonId),
    { autoFetch: canView, deps: [courseId, lessonId] },
  );
  const [completing, setCompleting] = useState(false);

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState denied title="الدرس غير متاح لصلاحياتك" />
      </Container>
    );
  }

  async function complete() {
    const res = await runCoursesMutation(
      () => staffCoursesService.markLessonComplete(courseId, lessonId),
      { loading: "جاري إكمال الدرس...", setLoading: setCompleting },
    );
    if (res) refetch();
  }

  const videos = lesson?.videos ?? [];
  const pdfs = lesson?.pdfs ?? [];
  const links = lesson?.links ?? [];
  const tests = lesson?.tests ?? [];
  const isCompleted = lesson?.completed === true || lesson?.isCompleted === true;
  const headerTitle = lesson?.title ?? `درس #${lessonId}`;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title={headerTitle}
        breadcrumbs={[
          { label: "دوراتي", href: "/v2/my-courses" },
          { label: "الدورة", href: `/v2/my-courses/${courseId}` },
          { label: headerTitle },
        ]}
        primaryAction={
          canTake
            ? {
                label: isCompleted ? "تم إكمال الدرس" : "إكمال الدرس",
                onClick: complete,
                icon: <MdCheckCircle />,
                disabled: completing || isCompleted,
                reason: isCompleted ? "أكملت هذا الدرس بالفعل" : undefined,
              }
            : undefined
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
      ) : isLoading && !lesson ? (
        <LoadingState variant="detail" />
      ) : !lesson ? (
        <EmptyState title="الدرس غير موجود" />
      ) : (
        <Stack spacing={2}>
          {lesson.description && (
            <SectionCard>
              <Typography variant="body2" color="text.secondary">
                {lesson.description}
              </Typography>
            </SectionCard>
          )}

          {videos.length > 0 && (
            <SectionCard title="الفيديوهات">
              <Stack spacing={2}>
                {videos.map((v) => (
                  <VideoBlock key={v.id} video={v} />
                ))}
              </Stack>
            </SectionCard>
          )}

          {pdfs.length > 0 && (
            <SectionCard title="الملفات">
              <List disablePadding>
                {pdfs.map((pdf) => (
                  <ListItem key={pdf.id} divider>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MdPictureAsPdf />
                      <MuiLink href={pdf.url} target="_blank" rel="noopener" sx={{ wordBreak: "break-all" }}>
                        {pdf.url}
                      </MuiLink>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            </SectionCard>
          )}

          {links.length > 0 && (
            <SectionCard title="روابط">
              <List disablePadding>
                {links.map((link) => (
                  <ListItem key={link.id} divider>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MdLink />
                      <MuiLink href={link.url} target="_blank" rel="noopener">
                        {link.title ?? link.url}
                      </MuiLink>
                    </Stack>
                  </ListItem>
                ))}
              </List>
            </SectionCard>
          )}

          {tests.length > 0 && (
            <SectionCard title="اختبارات الدرس">
              <List disablePadding>
                {tests.map((test) => (
                  <ListItem
                    key={test.id}
                    divider
                    secondaryAction={
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<MdQuiz />}
                        component={Link}
                        href={`/v2/my-courses/${courseId}/tests/${test.id}`}
                      >
                        ابدأ الاختبار
                      </Button>
                    }
                  >
                    <Typography>{test.title ?? `اختبار #${test.id}`}</Typography>
                  </ListItem>
                ))}
              </List>
            </SectionCard>
          )}

          {lesson.mustUploadHomework && canTake && (
            <HomeworkBlock courseId={courseId} lessonId={lessonId} />
          )}
        </Stack>
      )}
    </Container>
  );
}

function VideoBlock({ video }) {
  if (video.videoType === "IFRAME") {
    return (
      <Box sx={{ position: "relative", pt: "56.25%", borderRadius: 2, overflow: "hidden" }}>
        <Box
          component="iframe"
          src={video.url}
          title={`video-${video.id}`}
          allowFullScreen
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
        />
      </Box>
    );
  }
  return (
    <Box component="video" src={video.url} controls sx={{ width: "100%", borderRadius: 2 }} />
  );
}

// Homework submit (+ shows the caller's current submission). Body: { url, type, title? }.
function HomeworkBlock({ courseId, lessonId }) {
  const { data, isLoading, refetch } = useLazyResource(
    () => staffCoursesService.getHomework(courseId, lessonId),
    { deps: [courseId, lessonId] },
  );
  const [form, setForm] = useState({ url: "", type: "VIDEO", title: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) setForm((p) => ({ ...p, url: data.url ?? "", type: data.type ?? "VIDEO", title: data.title ?? "" }));
  }, [data]);

  async function submit() {
    const res = await runCoursesMutation(
      () =>
        staffCoursesService.submitHomework(courseId, lessonId, {
          url: form.url.trim(),
          type: form.type,
          title: form.title?.trim() || undefined,
        }),
      { loading: "جاري حفظ الواجب...", setLoading: setBusy },
    );
    if (res) refetch();
  }

  return (
    <SectionCard title="الواجب" subtitle="هذا الدرس يتطلّب رفع واجب لإكماله.">
      {isLoading ? (
        <LoadingState variant="form" fields={2} />
      ) : (
        <Stack spacing={2}>
          <TextField
            select
            label="نوع الواجب"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            sx={{ maxWidth: 240 }}
          >
            {HOMEWORK_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="عنوان الواجب (اختياري)"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />
          <TextField
            label="رابط الواجب"
            value={form.url}
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          />
          <Box>
            <Button variant="contained" onClick={submit} disabled={busy || !form.url.trim()}>
              حفظ الواجب
            </Button>
          </Box>
        </Stack>
      )}
    </SectionCard>
  );
}

export default LearnerLessonPage;
