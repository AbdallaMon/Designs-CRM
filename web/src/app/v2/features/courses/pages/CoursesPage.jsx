"use client";

// Courses — ADMIN authoring list (route /v2/courses, backend /v2/courses/*). Real screen:
// paginated course list + create / edit / delete + open a course to manage its lessons. Mirrors
// the leads page house style (hand-built MUI table over the SERVICE, usePermission gating, plain
// dialogs + runCoursesMutation CODE→Arabic toasts). The data layer (coursesService) is the only
// thing that talks to the API.
//
// Gating (shared-permissions §7): list/read on PERMISSIONS.COURSE.VIEW; create/edit/delete on
// COURSE.MANAGE, combined with the backend-computed row.capabilities.canManage (admin-course.dto
// decorateCourseList). UI gating is cosmetic; the server re-enforces. Single-language Arabic, RTL.

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdAdd, MdEdit, MdMenuBook, MdRefresh } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { coursesAdminColumns } from "../config/coursesColumns.js";
import { CreateCourseDialog } from "../components/CreateCourseDialog.jsx";
import { CourseLessonsDialog } from "../components/CourseLessonsDialog.jsx";

const P = PERMISSIONS.COURSE;
const DEFAULT_PAGE_SIZE = 10;

export function CoursesPage() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canManage = hasPermission(P.MANAGE);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [lessonsCourse, setLessonsCourse] = useState(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await coursesService.list({ page, limit: pageSize });
      const data = res?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (canView) fetchCourses();
  }, [canView, fetchCourses]);

  function openCreate() {
    setEditing(null);
    setCreateOpen(true);
  }
  function openEdit(course) {
    setEditing(course);
    setCreateOpen(true);
  }

  // NOTE: the admin course module exposes NO DELETE /courses/:id endpoint (only lesson /
  // content / test deletes), so course deletion is intentionally omitted from this list.

  // Per-row manage capability: code AND the backend-computed capability hint.
  const rowCanManage = (row) => canManage && (row.capabilities?.canManage ?? true);

  if (!canView) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <Typography color="text.secondary">لا تملك صلاحية الوصول إلى إدارة الدورات</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">إدارة الدورات</Typography>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="تحديث">
          <IconButton onClick={fetchCourses}>
            <MdRefresh />
          </IconButton>
        </Tooltip>
        {canManage && (
          <Button variant="contained" startIcon={<MdAdd />} onClick={openCreate} sx={{ ms: 1, ml: 1 }}>
            إنشاء دورة
          </Button>
        )}
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {coursesAdminColumns.map((c) => (
                <TableCell key={c.field}>{c.headerName}</TableCell>
              ))}
              <TableCell align="left">إجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={coursesAdminColumns.length + 1} align="center">
                  جاري التحميل...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={coursesAdminColumns.length + 1} align="center">
                  لا توجد دورات
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              items.map((row) => (
                <TableRow key={row.id} hover>
                  {coursesAdminColumns.map((c) => (
                    <TableCell key={c.field}>
                      {c.field === "isPublished" ? (
                        <Chip
                          size="small"
                          color={row.isPublished ? "success" : "default"}
                          label={row.isPublished ? "منشورة" : "مسودة"}
                        />
                      ) : (
                        c.accessor(row)
                      )}
                    </TableCell>
                  ))}
                  <TableCell align="left">
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="الدروس">
                        <IconButton size="small" onClick={() => setLessonsCourse(row)}>
                          <MdMenuBook />
                        </IconButton>
                      </Tooltip>
                      {rowCanManage(row) && (
                        <Tooltip title="تعديل الدورة">
                          <IconButton size="small" onClick={() => openEdit(row)}>
                            <MdEdit />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page - 1}
          onPageChange={(_e, p) => setPage(p + 1)}
          rowsPerPage={pageSize}
          onRowsPerPageChange={(e) => {
            setPageSize(parseInt(e.target.value, 10));
            setPage(1);
          }}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="عدد الصفوف"
        />
      </TableContainer>

      {canManage && (
        <CreateCourseDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          course={editing}
          onSaved={fetchCourses}
        />
      )}

      <CourseLessonsDialog
        open={Boolean(lessonsCourse)}
        onClose={() => setLessonsCourse(null)}
        course={lessonsCourse}
        onChanged={fetchCourses}
      />
    </Container>
  );
}

export default CoursesPage;
