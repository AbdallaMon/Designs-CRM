"use client";

// ★ Access tab (course editor) — COURSE.ACCESS_MANAGE. Two parts:
//   1) Allowed ROLES — read-only view of the roles that can see the course (getAllowedRoles).
//   2) Per-LESSON allowed USERS — pick a lesson, list its granted users (listAllowedUsers),
//      grant (grantAccess {userId}) / revoke (revokeAccess accessId). The lesson picker reuses
//      the lessons read. All five read-states wired; mutations route through runCoursesMutation.
//   Arabic / RTL.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdDelete, MdPersonAdd } from "react-icons/md";
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
import { resolveRoleLabel } from "@/app/v2/features/courses/config/coursesConstants.js";

export function AccessTab({ courseId }) {
  return (
    <Stack spacing={2}>
      <AllowedRolesSection courseId={courseId} />
      <LessonAccessSection courseId={courseId} />
    </Stack>
  );
}

// ── 1) allowed roles (read-only) ─────────────────────────────────────────────────────
function AllowedRolesSection({ courseId }) {
  const { data, isLoading, error, refetch } = useLazyResource(
    () => coursesService.getAllowedRoles(courseId),
    { deps: [courseId] },
  );
  const roles = Array.isArray(data) ? data : data?.roles ?? [];

  return (
    <SectionCard title="الأدوار المسموح لها" subtitle="الأدوار التي تستطيع رؤية هذه الدورة (تُحرَّر من إعدادات الدورة).">
      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
      ) : isLoading ? (
        <LoadingState variant="form" fields={1} />
      ) : roles.length === 0 ? (
        <EmptyState title="كل الأدوار" description="الدورة مرئية لكل الأدوار." />
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {roles.map((r, i) => (
            <Chip key={i} label={resolveRoleLabel(typeof r === "string" ? r : r.role)} />
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}

// ── 2) per-lesson allowed users (grant / revoke) ─────────────────────────────────────
function LessonAccessSection({ courseId }) {
  const lessonsRes = useLazyResource(() => coursesService.listLessons(courseId), { deps: [courseId] });
  const lessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : lessonsRes.data?.items ?? [];
  const [lessonId, setLessonId] = useState("");

  useEffect(() => {
    if (!lessonId && lessons.length) setLessonId(String(lessons[0].id));
  }, [lessons, lessonId]);

  return (
    <SectionCard title="صلاحيات الدروس" subtitle="امنح أو ألغِ وصول مستخدمين محددين إلى درس بعينه.">
      {lessonsRes.error ? (
        <ErrorState error={lessonsRes.error} onRetry={lessonsRes.refetch} resolver={coursesMessages} />
      ) : lessonsRes.isLoading ? (
        <LoadingState variant="form" fields={1} />
      ) : lessons.length === 0 ? (
        <EmptyState title="لا توجد دروس" description="أضف دروسًا أولاً لإدارة صلاحياتها." />
      ) : (
        <Stack spacing={2}>
          <TextField select label="الدرس" value={lessonId} onChange={(e) => setLessonId(e.target.value)} sx={{ maxWidth: 360 }}>
            {lessons.map((l) => (
              <MenuItem key={l.id} value={String(l.id)}>
                {l.title ?? `درس #${l.id}`}
              </MenuItem>
            ))}
          </TextField>
          {lessonId && <LessonUsers courseId={courseId} lessonId={lessonId} />}
        </Stack>
      )}
    </SectionCard>
  );
}

function LessonUsers({ courseId, lessonId }) {
  const { data, isLoading, error, refetch } = useLazyResource(
    () => coursesService.listAllowedUsers(courseId, lessonId),
    { deps: [courseId, lessonId] },
  );
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);

  const users = Array.isArray(data) ? data : data?.items ?? [];

  async function grant() {
    if (!String(userId).trim()) return;
    const res = await runCoursesMutation(
      () => coursesService.grantAccess(courseId, lessonId, Number(userId)),
      { loading: "جاري منح الصلاحية...", setLoading: setBusy },
    );
    if (res) {
      setUserId("");
      refetch();
    }
  }
  async function revoke(access) {
    const res = await runCoursesMutation(
      () => coursesService.revokeAccess(courseId, lessonId, access.id),
      { loading: "جاري إلغاء الصلاحية...", setLoading: setBusy },
    );
    if (res) refetch();
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <TextField
          size="small"
          type="number"
          label="معرّف المستخدم"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          sx={{ maxWidth: 200 }}
        />
        <Button variant="contained" size="small" startIcon={<MdPersonAdd />} onClick={grant} disabled={busy || !String(userId).trim()}>
          منح الوصول
        </Button>
      </Stack>

      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
      ) : isLoading ? (
        <LoadingState variant="form" fields={1} />
      ) : users.length === 0 ? (
        <EmptyState title="لا يوجد مستخدمون مُمنوحون" description="هذا الدرس متاح وفق قواعد الدورة العامة فقط." />
      ) : (
        <List disablePadding>
          {users.map((access) => (
            <ListItem
              key={access.id}
              divider
              secondaryAction={
                <Tooltip title="إلغاء الوصول">
                  <IconButton edge="end" size="small" color="error" onClick={() => revoke(access)} disabled={busy}>
                    <MdDelete />
                  </IconButton>
                </Tooltip>
              }
            >
              <Typography variant="body2">
                {access.user?.name ?? access.userName ?? `مستخدم #${access.userId ?? access.user?.id ?? access.id}`}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

export default AccessTab;
