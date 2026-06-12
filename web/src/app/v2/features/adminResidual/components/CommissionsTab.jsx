"use client";

// Commissions tab — العمولات. The backend read is PER-USER (GET /v2/admin/commissions?userId=
// is required, BE Zod .positive()), so the flow is: pick a staff member → list their
// commission rows. Each row: { id, amount, amountPaid, isCleared, createdAt, commissionReason,
// leadId, lead: { id, client: { name, phone } } }. The list call ALSO auto-seeds 5% commissions
// for the user's eligible finalized/archived leads (frozen service behavior) — read-only here.
// Editing a commission's amount is gated on COMMISSION_MANAGE (PUT /commissions/:id { amount }).
// Arabic / RTL.

import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdEdit, MdRefresh } from "react-icons/md";
import { adminResidualService } from "../adminResidual.service.js";
import { runAdminResidualMutation } from "../adminResidual.mutations.js";
import { StaffUserPicker } from "./StaffUserPicker.jsx";
import { formatAed, formatDate } from "../config/adminResidualConstants.js";

export function CommissionsTab({ canManage = false }) {
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);

  async function load(uid = userId) {
    if (!uid) return;
    setIsLoading(true);
    try {
      const res = await adminResidualService.listCommissions({ userId: uid });
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
      setLoaded(true);
    } catch {
      setRows([]);
      setLoaded(true);
    } finally {
      setIsLoading(false);
    }
  }

  function onPickUser(uid) {
    setUserId(uid);
    setLoaded(false);
    setRows([]);
    if (uid) load(uid);
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.amount += Number(r.amount || 0);
      acc.paid += Number(r.amountPaid || 0);
      return acc;
    },
    { amount: 0, paid: 0 },
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        العمولات
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        اختر موظفًا لعرض عمولاته. تُحتسب العمولة تلقائيًا بنسبة 5% من العملاء المنتهين/المؤرشفين المؤهلين.
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 8, md: 6 }}>
              <StaffUserPicker label="الموظف" value={userId} onChange={onPickUser} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MdRefresh />}
                onClick={() => load()}
                disabled={!userId || isLoading}
              >
                تحديث
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!userId ? (
        <Centered text="اختر موظفًا لعرض العمولات" />
      ) : isLoading ? (
        <Centered text="جاري التحميل..." />
      ) : loaded && rows.length === 0 ? (
        <Centered text="لا توجد عمولات لهذا الموظف" />
      ) : (
        <>
          {/* Summary cards */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="عدد العمولات" value={rows.length} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="إجمالي العمولات" value={formatAed(totals.amount)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="إجمالي المدفوع" value={formatAed(totals.paid)} />
            </Grid>
          </Grid>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>العميل</TableCell>
                  <TableCell>القيمة</TableCell>
                  <TableCell>المدفوع</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>السبب</TableCell>
                  <TableCell>التاريخ</TableCell>
                  {canManage && <TableCell align="left">إجراءات</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.lead?.client?.name ?? `عميل #${r.leadId ?? "—"}`}</TableCell>
                    <TableCell>{formatAed(r.amount)}</TableCell>
                    <TableCell>{formatAed(r.amountPaid)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={r.isCleared ? "success" : "default"}
                        label={r.isCleared ? "مسددة" : "غير مسددة"}
                      />
                    </TableCell>
                    <TableCell>{r.commissionReason || "—"}</TableCell>
                    <TableCell>{formatDate(r.createdAt)}</TableCell>
                    {canManage && (
                      <TableCell align="left">
                        <Tooltip title="تعديل القيمة">
                          <IconButton size="small" onClick={() => setEditRow(r)}>
                            <MdEdit />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {canManage && editRow && (
        <EditAmountDialog
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            setEditRow(null);
            load();
          }}
        />
      )}
    </Box>
  );
}

function EditAmountDialog({ row, onClose, onSaved }) {
  const [amount, setAmount] = useState(String(row.amount ?? ""));
  const [busy, setBusy] = useState(false);

  async function save() {
    const num = Number(amount);
    if (!Number.isFinite(num) || num <= 0) return;
    const res = await runAdminResidualMutation(
      () => adminResidualService.updateCommission(row.id, { amount: num }),
      { loading: "جاري حفظ القيمة...", setLoading: setBusy },
    );
    if (res) onSaved();
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>تعديل قيمة العمولة</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            العميل: {row.lead?.client?.name ?? `#${row.leadId ?? "—"}`}
          </Typography>
          <TextField
            label="القيمة (د.إ)"
            type="number"
            size="small"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0, step: "0.01" }}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          إلغاء
        </Button>
        <Button variant="contained" onClick={save} disabled={busy}>
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StatCard({ label, value }) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ py: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Centered({ text }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <Typography color="text.secondary">{text}</Typography>
    </Box>
  );
}

export default CommissionsTab;
