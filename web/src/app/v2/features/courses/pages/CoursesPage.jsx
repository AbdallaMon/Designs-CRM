"use client";

// Courses (ADMIN authoring) LIST + LMS dashboard — redesigned on the Phase-0 shared primitives
// (PageHeader + SectionCard + DataTablePage + the five states). Replaces the foundation
// smoke-screen. Visibility gates on PERMISSIONS.COURSE.VIEW; the "إنشاء دورة" CTA + edit action
// gate on PERMISSIONS.COURSE.MANAGE (the admin list dto emits no capabilities.*, so admin gating
// is code-only — see courses.service.js). Each course row links to the course editor
// (/v2/courses/[courseId]). UI gating is cosmetic; the BE still enforces. Arabic / RTL.

import { useEffect, useMemo, useState } from "react";
import { Box, Container, Grid, IconButton, Tooltip, Typography } from "@mui/material";
import { MdOpenInNew, MdEdit, MdSchool, MdMenuBook, MdQuiz, MdPeople } from "react-icons/md";
import Link from "next/link";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PageHeader,
  SectionCard,
  DataTablePage,
  PartialPermissionState,
  LoadingState,
} from "@/app/v2/shared/components";
import { useCoursesList } from "../hooks/useCoursesList.js";
import { useLazyResource } from "../hooks/useLazyResource.js";
import { coursesService } from "../courses.service.js";
import { coursesColumns } from "../config/coursesColumns.js";
import { coursesFilters } from "../config/coursesFilters.js";
import { coursesMessages } from "../config/coursesMessages.js";
import { COURSES_UI } from "../config/coursesConstants.js";
import { CourseFormDialog } from "../components/CourseFormDialog.jsx";

const P = PERMISSIONS.COURSE;

export function CoursesPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canManage = hasPermission(P.MANAGE);

  const [filterValues, setFilterValues] = useState({ search: "", status: "ALL" });
  const [dialog, setDialog] = useState({ open: false, course: null });

  const { items, total, page, setPage, pageSize, setPageSize, isLoading, error, refetch } =
    useCoursesList({ autoFetch: canView });

  // LMS dashboard (getDashboard) — secondary KPI tier above the list.
  const { data: dashboard, isLoading: dashLoading } = useLazyResource(
    () => coursesService.getDashboard(),
    { autoFetch: canView, deps: [canView] },
  );

  // Client-side filtering of the current page (the BE list honors only page/limit).
  const rows = useMemo(() => {
    const term = String(filterValues.search ?? "").trim().toLowerCase();
    return items.filter((c) => {
      if (term && !String(c.title ?? "").toLowerCase().includes(term)) return false;
      if (filterValues.status === "PUBLISHED" && !c.isPublished) return false;
      if (filterValues.status === "DRAFT" && c.isPublished) return false;
      return true;
    });
  }, [items, filterValues]);

  function onFilterChange(key, value) {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }

  function renderRowActions(row) {
    return (
      <>
        {canManage && (
          <Tooltip title={COURSES_UI.editCourse}>
            <IconButton
              size="small"
              onClick={() => setDialog({ open: true, course: row })}
            >
              <MdEdit />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title={COURSES_UI.openEditor}>
          <IconButton size="small" component={Link} href={`/v2/courses/${row.id}`}>
            <MdOpenInNew />
          </IconButton>
        </Tooltip>
      </>
    );
  }

  const empty = useMemo(
    () => ({
      title: COURSES_UI.noCourses,
      description: canManage ? COURSES_UI.noCoursesHintCreate : COURSES_UI.noCoursesHintView,
      action: canManage
        ? { label: COURSES_UI.createCourse, onClick: () => setDialog({ open: true, course: null }) }
        : undefined,
    }),
    [canManage],
  );

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState
          denied
          title={COURSES_UI.deniedAdmin}
          message={COURSES_UI.deniedAdminMsg}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title={COURSES_UI.adminTitle}
        subtitle={`${COURSES_UI.adminSubtitlePrefix}: ${total}`}
        breadcrumbs={[{ label: "التعلّم" }, { label: COURSES_UI.adminTitle }]}
        primaryAction={
          canManage
            ? { label: COURSES_UI.createCourse, onClick: () => setDialog({ open: true, course: null }) }
            : undefined
        }
      />

      <Box sx={{ mb: 3 }}>
        {dashLoading ? (
          <LoadingState variant="cards" count={4} columns={4} height={104} />
        ) : (
          <Grid container spacing={2}>
            <DashCard icon={<MdSchool />} label="الدورات" value={dashboard?.coursesCount ?? total} />
            <DashCard icon={<MdMenuBook />} label="الدروس" value={dashboard?.lessonsCount} />
            <DashCard icon={<MdQuiz />} label="الاختبارات" value={dashboard?.testsCount} />
            <DashCard icon={<MdPeople />} label="المتعلّمون" value={dashboard?.learnersCount} />
          </Grid>
        )}
      </Box>

      <DataTablePage
        columns={coursesColumns}
        filters={coursesFilters}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        errorResolver={coursesMessages}
        getRowKey={(row) => row.id}
        renderRowActions={renderRowActions}
        rowHref={(row) => `/v2/courses/${row.id}`}
        empty={empty}
      />

      {canManage && (
        <CourseFormDialog
          open={dialog.open}
          course={dialog.course}
          onClose={() => setDialog({ open: false, course: null })}
          onSaved={() => {
            setDialog({ open: false, course: null });
            refetch();
          }}
        />
      )}
    </Container>
  );
}

function DashCard({ icon, label, value }) {
  return (
    <Grid size={{ xs: 6, sm: 3 }}>
      <SectionCard sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ fontSize: 28, color: "primary.main", display: "flex" }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
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

export default CoursesPage;
