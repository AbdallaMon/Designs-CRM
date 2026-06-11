"use client";

// ★ Attempts admin tab (course editor) — COURSE.ATTEMPT_MANAGE. Master → detail:
//   • Master: paginated attempt summaries (listAttemptsSummary {page,limit,userId?}) in a
//     <DataTablePage>. Each row identifies a test + user.
//   • Detail: pick a row → full attempt records for that (test,user) (listUserAttempts), with
//     +1 / −1 attempt (increaseAttempt / decreaseAttempt) and per-answer approve (approveAnswer
//     {isApproved}). Every mutation routes through runCoursesMutation (CODE → Arabic toast).
//   All five read-states wired. Arabic / RTL.

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdAdd, MdRemove, MdCheck, MdClose, MdArrowBack } from "react-icons/md";
import {
  DataTablePage,
  SectionCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/app/v2/shared/components";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";
import { coursesMessages } from "@/app/v2/features/courses/config/coursesMessages.js";

const summaryColumns = [
  { field: "testTitle", headerName: "الاختبار", accessor: (r) => r.testTitle ?? r.test?.title ?? `اختبار #${r.testId ?? r.test?.id ?? "—"}` },
  { field: "userName", headerName: "المستخدم", accessor: (r) => r.userName ?? r.user?.name ?? `مستخدم #${r.userId ?? r.user?.id ?? "—"}` },
  { field: "attemptsUsed", headerName: "المحاولات المستخدمة", align: "center", accessor: (r) => r.attemptCount ?? r.attemptsUsed ?? "—" },
  { field: "attemptLimit", headerName: "الحد الأقصى", align: "center", accessor: (r) => r.attemptLimit ?? "—" },
];

function rowTestId(r) {
  return r.testId ?? r.test?.id;
}
function rowUserId(r) {
  return r.userId ?? r.user?.id;
}

export function AttemptsTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValues, setFilterValues] = useState({ userId: "" });
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // { testId, userId, label }

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await coursesService.listAttemptsSummary({
        page,
        limit: pageSize,
        userId: String(filterValues.userId ?? "").trim() || undefined,
      });
      const data = res?.data ?? {};
      setRows(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total) || 0);
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filterValues.userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (selected) {
    return (
      <Box>
        <Button startIcon={<MdArrowBack />} onClick={() => setSelected(null)} sx={{ mb: 2 }}>
          رجوع إلى الملخّص
        </Button>
        <UserAttemptsDetail testId={selected.testId} userId={selected.userId} label={selected.label} onChanged={fetchSummary} />
      </Box>
    );
  }

  return (
    <SectionCard title="ملخّص المحاولات" subtitle="اعرض محاولات المستخدمين، عدّل عددها واعتمد إجاباتهم.">
      <DataTablePage
        columns={summaryColumns}
        filters={[{ key: "userId", type: "search", label: "معرّف المستخدم", placeholder: "تصفية حسب المستخدم" }]}
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        filterValues={filterValues}
        onFilterChange={(k, v) => {
          setFilterValues((p) => ({ ...p, [k]: v }));
          setPage(1);
        }}
        loading={isLoading}
        error={error}
        onRetry={fetchSummary}
        errorResolver={coursesMessages}
        getRowKey={(r) => `${rowTestId(r)}-${rowUserId(r)}`}
        onRowClick={(r) =>
          setSelected({
            testId: rowTestId(r),
            userId: rowUserId(r),
            label: `${r.testTitle ?? r.test?.title ?? "اختبار"} — ${r.userName ?? r.user?.name ?? "مستخدم"}`,
          })
        }
        empty={{ title: "لا توجد محاولات", description: "ستظهر محاولات المستخدمين هنا فور بدئها." }}
      />
    </SectionCard>
  );
}

function UserAttemptsDetail({ testId, userId, label, onChanged }) {
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await coursesService.listUserAttempts(testId, userId);
      setData(res?.data ?? null);
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
    } finally {
      setLoading(false);
    }
  }, [testId, userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const attempts = Array.isArray(data) ? data : data?.attempts ?? data?.items ?? [];

  async function adjust(dir) {
    const res = await runCoursesMutation(
      () => (dir > 0 ? coursesService.increaseAttempt(testId, userId) : coursesService.decreaseAttempt(testId, userId)),
      { loading: dir > 0 ? "جاري زيادة المحاولات..." : "جاري إنقاص المحاولات...", setLoading: setBusy },
    );
    if (res) {
      fetch();
      onChanged?.();
    }
  }

  async function approve(attemptId, questionId, isApproved) {
    const res = await runCoursesMutation(
      () => coursesService.approveAnswer(testId, attemptId, questionId, isApproved),
      { loading: "جاري اعتماد الإجابة...", setLoading: setBusy },
    );
    if (res) fetch();
  }

  return (
    <SectionCard
      title={label}
      actions={
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" startIcon={<MdAdd />} onClick={() => adjust(1)} disabled={busy}>
            محاولة +1
          </Button>
          <Button size="small" variant="outlined" color="error" startIcon={<MdRemove />} onClick={() => adjust(-1)} disabled={busy}>
            محاولة −1
          </Button>
        </Stack>
      }
    >
      {error ? (
        <ErrorState error={error} onRetry={fetch} resolver={coursesMessages} />
      ) : isLoading ? (
        <LoadingState variant="form" fields={3} />
      ) : attempts.length === 0 ? (
        <EmptyState title="لا توجد محاولات لهذا المستخدم" />
      ) : (
        <Stack spacing={2}>
          {attempts.map((attempt) => (
            <Box key={attempt.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">محاولة #{attempt.id}</Typography>
                <Chip
                  size="small"
                  label={attempt.passed ? "ناجحة" : attempt.score != null ? "غير ناجحة" : "بانتظار التصحيح"}
                  color={attempt.passed ? "success" : "default"}
                />
                {attempt.score != null && <Chip size="small" variant="outlined" label={`الدرجة: ${attempt.score}`} />}
              </Stack>
              <List disablePadding>
                {(attempt.answers ?? []).map((ans) => (
                  <ListItem
                    key={ans.id}
                    divider
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="اعتماد">
                          <IconButton size="small" color="success" onClick={() => approve(attempt.id, ans.questionId, true)} disabled={busy}>
                            <MdCheck />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="رفض">
                          <IconButton size="small" color="error" onClick={() => approve(attempt.id, ans.questionId, false)} disabled={busy}>
                            <MdClose />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <Box sx={{ minWidth: 0, pe: 8 }}>
                      <Typography variant="body2">
                        {ans.question?.question ?? `سؤال #${ans.questionId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        الإجابة: {ans.textAnswer || (ans.selectedAnswers ?? []).map((s) => s.value).join("، ") || "—"}
                        {" · "}
                        {ans.isApproved ? "معتمدة" : "غير معتمدة"}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Stack>
      )}
    </SectionCard>
  );
}

export default AttemptsTab;
