"use client";

// Courses (ADMIN authoring) — FOUNDATION smoke-screen. This is NOT the redesigned authoring
// UI; it only PROVES the v2 wiring: permission gate (PERMISSIONS.COURSE) + the courses.service
// data layer + the coursesMessages CODE→Arabic resolver, fetching and rendering the course
// list. The real authoring screens (lessons/videos/tests/attempts editors) come in the later
// UX-redesign phase, building on this data layer. Arabic, RTL, single-language.

import { useEffect } from "react";
import { Box, Container, List, ListItem, ListItemText, Typography } from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { COURSES_URL } from "../config/constant.js";
import { resolveCoursesMessage } from "../config/coursesMessages.js";

const P = PERMISSIONS.COURSE;

export function CoursesPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);

  // GET /v2/courses?page&limit → data:{ items, total, page, pageSize }. autoFetch only when
  // the user holds course.view (cosmetic; the server enforces independently).
  const { data, isLoading, fetchData, successMessage } = useRequest({
    url: COURSES_URL,
    method: "get",
    autoFetch: false,
  });

  useEffect(() => {
    if (canView) fetchData({ page: 1, limit: 10 });
  }, [canView, fetchData]);

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى إدارة الدورات</Typography>
      </Box>
    );
  }

  const items = data?.items ?? [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        إدارة الدورات
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isLoading ? "جاري التحميل..." : resolveCoursesMessage(successMessage)}
        {data?.total != null ? ` — الإجمالي: ${data.total}` : ""}
      </Typography>

      {!isLoading && items.length === 0 ? (
        <Typography color="text.secondary">لا توجد دورات</Typography>
      ) : (
        <List>
          {items.map((c) => (
            <ListItem key={c.id} divider>
              <ListItemText
                primary={c.title ?? `دورة #${c.id}`}
                secondary={c.isPublished ? "منشورة" : "مسودة"}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default CoursesPage;
