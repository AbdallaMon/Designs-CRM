"use client";

// My Courses (STAFF learner) — FOUNDATION smoke-screen. NOT the redesigned learner UI; it only
// PROVES the v2 wiring: permission gate (PERMISSIONS.STAFF_COURSE) + the staffCourses.service
// data layer + the coursesMessages CODE→Arabic resolver, fetching and rendering the learner
// course list. The real learner screens (lesson viewer, video player, test-taker, homework
// upload) come in the later UX-redesign phase. Arabic, RTL, single-language.

import { useEffect } from "react";
import { Box, Container, List, ListItem, ListItemText, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { STAFF_COURSES_URL } from "../config/constant.js";
import { resolveCoursesMessage } from "../config/coursesMessages.js";

const P = PERMISSIONS.STAFF_COURSE;

export function MyCoursesPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  // GET /v2/staff-courses?page&limit → data:{ items, total, page, pageSize }.
  const { data, isLoading, fetchData, successMessage } = useRequest({
    url: STAFF_COURSES_URL,
    method: "get",
    autoFetch: false,
  });

  useEffect(() => {
    if (canView) fetchData({ page: 1, limit: 10 });
  }, [canView, fetchData]);

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى الدورات</Typography>
      </Box>
    );
  }

  const items = data?.items ?? [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        دوراتي
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isLoading ? "جاري التحميل..." : resolveCoursesMessage(successMessage)}
        {data?.total != null ? ` — الإجمالي: ${data.total}` : ""}
      </Typography>

      {!isLoading && items.length === 0 ? (
        <Typography color="text.secondary">لا توجد دورات متاحة</Typography>
      ) : (
        <List>
          {items.map((c) => (
            <ListItem key={c.id} divider>
              <ListItemText primary={c.title ?? `دورة #${c.id}`} secondary={c.description ?? ""} />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default MyCoursesPage;
