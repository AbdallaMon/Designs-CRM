"use client";

// Questions page — the standalone, LEAD-SCOPED SPIN session-questions screen. Session questions
// are scoped to a parent ClientLead, and the route `/v2/questions` carries no lead context, so
// the flow is: pick/identify a lead → fetch that lead's question-type config (which also SEEDS
// the lead's session-question rows server-side) → render the SPIN board grouped by type → let an
// authorized user answer / update each question via the answer action.
//
// The selected lead lives in the URL (`?leadId=`) so the screen is shareable / embeddable; the
// server page seeds it (Next 16 searchParams is async) and this client panel keeps it in sync.
// Mirrors features/salesStages/pages/SalesStagesPanel.jsx (the canonical lead-scoped screen).
//
// PERMISSIONS (the dto emits NO capabilities.* — gate on the CODES; the server enforces the lead
// object-scope on every read/write):
//   - read   → QUESTION.CONFIG_VIEW (question types) + QUESTION.SESSION_VIEW (session questions).
//              Without CONFIG_VIEW the screen can't load/seed the board, so it's the entry gate.
//   - answer → QUESTION.ANSWER_SUBMIT  (gated inside the board, per-question)
//
// Data flows through the v2 layer only: useRequest → questionsService → apiFetch (/v2). Single
// Arabic, RTL. (VERSA objection-handling is a separate sub-surface — see index.js note.)

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdArrowForward, MdRefresh } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { questionTypesUrl } from "../config/constant.js";
import { QuestionsLeadPicker } from "../components/QuestionsLeadPicker.jsx";
import { SessionQuestionsBoard } from "../components/SessionQuestionsBoard.jsx";

const P = PERMISSIONS.QUESTION;

export function QuestionsPanel({ leadId: initialLeadId }) {
  const { hasPermission } = usePermission();
  const canViewConfig = hasPermission(P.CONFIG_VIEW);
  const canViewSession = hasPermission(P.SESSION_VIEW);
  const canAnswer = hasPermission(P.ANSWER_SUBMIT);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth for the selected lead; seed from the server-passed prop.
  const urlLeadId = searchParams.get("leadId") ?? "";
  const [leadId, setLeadId] = useState(
    urlLeadId || (initialLeadId ? String(initialLeadId) : ""),
  );

  // Keep local state in sync if the URL changes (back/forward, external link).
  useEffect(() => {
    if (urlLeadId && urlLeadId !== leadId) setLeadId(urlLeadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlLeadId]);

  const setLeadInUrl = useCallback(
    (next) => {
      setLeadId(next || "");
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("leadId", next);
      else params.delete("leadId");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const hasLead = Boolean(leadId);
  // Fetching the question types ALSO idempotently seeds this lead's session-question rows on the
  // BE (getQuestionTypes → ensureSessionQuestions), so it must precede the board's per-type
  // session reads. Gate on CONFIG_VIEW (the entry gate).
  const { data, isLoading, error, refetch } = useRequest({
    url: hasLead ? questionTypesUrl(leadId) : "",
    method: "get",
    autoFetch: canViewConfig && hasLead,
  });

  if (!canViewConfig && !canViewSession) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">لا تملك صلاحية عرض أسئلة العميل.</Alert>
      </Container>
    );
  }

  // The read returns the global QuestionType rows (each with baseQuestions) under the envelope
  // `data` (no dto wrapping).
  const types = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">أسئلة العميل (جلسة SPIN)</Typography>
        {hasLead && (
          <Stack direction="row" spacing={1}>
            <Tooltip title="تحديث">
              <span>
                <IconButton onClick={() => refetch()} disabled={isLoading}>
                  <MdRefresh />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="اختيار عميل آخر">
              <IconButton onClick={() => setLeadInUrl("")}>
                <MdArrowForward />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      {!canViewConfig && hasLead && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          لا تملك صلاحية تهيئة أسئلة الجلسة لهذا العميل.
        </Alert>
      )}

      {!hasLead && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            أسئلة الجلسة مرتبطة بعميل محدد. اختر عميلاً أولاً لعرض أسئلته وإدارة إجاباتها.
          </Alert>
          <QuestionsLeadPicker selectedLeadId={leadId} onPick={setLeadInUrl} />
        </Box>
      )}

      {hasLead && canViewConfig && isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {hasLead && canViewConfig && !isLoading && error && (
        <Alert severity="error">تعذر تجهيز أسئلة العميل. حاول مرة أخرى.</Alert>
      )}

      {hasLead && canViewConfig && !isLoading && !error && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            العميل #{leadId}
          </Typography>
          {!canAnswer && (
            <Alert severity="info" sx={{ mb: 1 }}>
              يمكنك عرض الأسئلة والإجابات فقط (لا تملك صلاحية حفظ الإجابات).
            </Alert>
          )}
          <SessionQuestionsBoard
            clientLeadId={leadId}
            types={types}
            canAnswer={canAnswer}
          />
        </Box>
      )}
    </Container>
  );
}

export default QuestionsPanel;
