"use client";

// Course EDITOR (admin authoring detail) — URL-tabbed on the Phase-0 primitives (PageHeader +
// UrlTabs + the five states), mirroring UserDetailPage. The tab SET is filtered by permission
// CODE (the same predicate that gates each tab's content): Lessons/Tests need COURSE.VIEW,
// Access needs COURSE.ACCESS_MANAGE, Attempts needs COURSE.ATTEMPT_MANAGE. Active tab lives in
// ?tab= via <UrlTabs>; each panel mounts only when active (lazy per-tab fetching). The admin
// list dto emits no capabilities.*, so gating is permission-code-only. Arabic / RTL.

import { useMemo } from "react";
import { Container } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PageHeader,
  UrlTabs,
  LoadingState,
  ErrorState,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { coursesMessages } from "@/app/v2/features/courses/config/coursesMessages.js";
import { publishLabel } from "@/app/v2/features/courses/config/coursesConstants.js";
import { useCourseDetail } from "../hooks/useCourseDetail.js";
import { LessonsTab } from "../components/tabs/LessonsTab.jsx";
import { TestsTab } from "../components/tabs/TestsTab.jsx";
import { AccessTab } from "../components/tabs/AccessTab.jsx";
import { AttemptsTab } from "../components/tabs/AttemptsTab.jsx";

const P = PERMISSIONS.COURSE;

export function CourseEditorPage({ courseId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canManage = hasPermission(P.MANAGE);
  const canAccess = hasPermission(P.ACCESS_MANAGE);
  const canAttempts = hasPermission(P.ATTEMPT_MANAGE);

  const { course, isLoading, error, refetch } = useCourseDetail(courseId, { autoFetch: canView });

  const tabs = useMemo(() => {
    const t = [];
    if (canView) t.push({ key: "lessons", label: "الدروس" });
    if (canView) t.push({ key: "tests", label: "الاختبارات" });
    if (canAccess) t.push({ key: "access", label: "الصلاحيات" });
    if (canAttempts) t.push({ key: "attempts", label: "المحاولات" });
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState
          denied
          title="محرّر الدورة غير متاح لصلاحياتك"
          message="لا تملك صلاحية عرض هذه الدورة."
        />
      </Container>
    );
  }

  const headerTitle = course?.title ?? `دورة #${courseId}`;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title={headerTitle}
        subtitle={course ? publishLabel(course.isPublished) : undefined}
        breadcrumbs={[
          { label: "التعلّم" },
          { label: "إدارة الدورات", href: "/v2/courses" },
          { label: headerTitle },
        ]}
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
      ) : isLoading && !course ? (
        <LoadingState variant="detail" />
      ) : (
        <UrlTabs tabs={tabs}>
          {(active) => (
            <div style={{ minHeight: 320 }}>
              {active === "lessons" && (
                <LessonsTab courseId={courseId} canManage={canManage} />
              )}
              {active === "tests" && (
                <TestsTab courseId={courseId} canManage={canManage} />
              )}
              {active === "access" && canAccess && (
                <AccessTab courseId={courseId} />
              )}
              {active === "attempts" && canAttempts && <AttemptsTab />}
            </div>
          )}
        </UrlTabs>
      )}
    </Container>
  );
}

export default CourseEditorPage;
