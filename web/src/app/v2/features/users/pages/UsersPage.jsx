"use client";

// Users feature — WIRING SMOKE SCREEN (NOT the redesigned UI). Foundation phase ("Option A"):
// proves the v2 data layer is wired end-to-end (service → hook → permission gate → render)
// so a later UX-redesign phase builds the real admin user-management / profile / directory
// screens once, on top of this contract. Gated on user.list; the BE still enforces.
// Arabic, RTL, single-language.

import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { useUsersList } from "../hooks/useUsersList.js";
import { resolveUsersMessage } from "../config/usersMessages.js";

const P = PERMISSIONS.USER;

export function UsersPage() {
  const { hasPermission } = usePermission();
  const canList = hasPermission(P.LIST);

  const { items, total, isLoading, error } = useUsersList({ autoFetch: canList });

  if (!canList) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">لا تملك صلاحية عرض المستخدمين</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" component="h1">
          المستخدمون
        </Typography>
        <Typography variant="body2" color="text.secondary">
          الإجمالي: {total}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {resolveUsersMessage(error, { fallback: "تعذر جلب المستخدمين" })}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>الاسم</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>الدور</TableCell>
              <TableCell>الحالة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  لا يوجد مستخدمون
                </TableCell>
              </TableRow>
            ) : (
              items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={u.isActive ? "success" : "default"}
                      label={u.isActive ? "نشط" : "موقوف"}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Container>
  );
}

export default UsersPage;
