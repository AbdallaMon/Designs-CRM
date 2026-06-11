"use client";

// ★ Test-taker page (STAFF) — the bespoke attempt flow on useAttemptFlow + the Phase-0 primitives.
// Gated STAFF_COURSE.VIEW (read) / STAFF_COURSE.TAKE (start/answer/end). Screens by phase:
//   • ready    → test intro + attempts-left; "ابدأ الاختبار" (or "لا توجد محاولات متبقية" — UI hint,
//                server trusted). Resumes an in-progress attempt automatically on load.
//   • inProgress → one question at a time (paged), each answer autosaves (submitAnswer); an
//                optional countdown (test.timeLimit) auto-ends on expiry; "إنهاء الاختبار" on the
//                last question.
//   • finished → result via <SuccessState>: score / passed, or "بانتظار التصحيح" when manual
//                grading is pending (score null).
// All five states wired (loading / error+retry / the partial-permission deny / empty questions /
// success). Single-language Arabic / RTL.

import { useState } from "react";
import {
  Box,
  Button,
  Container,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { MdArrowForward, MdArrowBack, MdFlag } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  PageHeader,
  SectionCard,
  PartialPermissionState,
  LoadingState,
  ErrorState,
  EmptyState,
  SuccessState,
} from "@/app/v2/shared/components";
import { coursesMessages } from "../../config/coursesMessages.js";
import { resolveQuestionTypeLabel } from "../../config/coursesConstants.js";
import { useAttemptFlow } from "../hooks/useAttemptFlow.js";
import { QuestionInput } from "../components/QuestionInput.jsx";
import { AttemptTimer } from "../components/AttemptTimer.jsx";

const P = PERMISSIONS.STAFF_COURSE;

export function TestTakerPage({ courseId, testId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.VIEW);
  const canTake = hasPermission(P.TAKE);

  const flow = useAttemptFlow(testId);
  const [index, setIndex] = useState(0);

  if (!canView) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <PartialPermissionState denied title="الاختبار غير متاح لصلاحياتك" />
      </Container>
    );
  }

  const title = flow.test?.title ?? `اختبار #${testId}`;
  const backHref = courseId ? `/v2/my-courses/${courseId}` : "/v2/my-courses";

  const header = (
    <PageHeader
      title={title}
      breadcrumbs={[
        { label: "دوراتي", href: "/v2/my-courses" },
        { label: "الدورة", href: backHref },
        { label: title },
      ]}
    />
  );

  if (flow.phase === "loading") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {header}
        <LoadingState variant="form" fields={4} />
      </Container>
    );
  }

  if (flow.phase === "error") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {header}
        <ErrorState error={flow.error} onRetry={flow.reload} resolver={coursesMessages} />
      </Container>
    );
  }

  if (flow.phase === "finished") {
    const at = flow.attempt;
    const pendingManual = at?.score == null;
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {header}
        <SuccessState
          title={pendingManual ? "تم إرسال إجاباتك" : at?.passed ? "أحسنت! اجتزت الاختبار" : "انتهى الاختبار"}
          message={
            pendingManual
              ? "بانتظار التصحيح — ستظهر نتيجتك بعد مراجعة المسؤول."
              : `درجتك: ${at?.score}${at?.passed ? " — ناجح" : ""}`
          }
          primary={{ label: "العودة إلى الدورة", href: backHref }}
        />
      </Container>
    );
  }

  // ── ready ───────────────────────────────────────────────────────────────────────
  if (flow.phase === "ready") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {header}
        <SectionCard title="قبل أن تبدأ">
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              عدد المحاولات المستخدمة: {flow.attemptsUsed}
              {flow.attemptLimit != null ? ` من ${flow.attemptLimit}` : ""}
            </Typography>
            {flow.timeLimitMin != null && (
              <Typography variant="body2" color="text.secondary">
                مدة الاختبار: {flow.timeLimitMin} دقيقة
              </Typography>
            )}
            {flow.noAttemptsLeft ? (
              <Typography color="error">لا توجد محاولات متبقية</Typography>
            ) : (
              <Box>
                <Button
                  variant="contained"
                  onClick={flow.start}
                  disabled={!canTake || flow.busy}
                >
                  ابدأ الاختبار
                </Button>
              </Box>
            )}
          </Stack>
        </SectionCard>
      </Container>
    );
  }

  // ── inProgress ──────────────────────────────────────────────────────────────────
  const questions = flow.questions;
  if (!questions.length) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        {header}
        <EmptyState title="لا توجد أسئلة في هذا الاختبار" />
      </Container>
    );
  }

  const q = questions[index];
  const total = questions.length;
  const isLast = index === total - 1;
  const value = flow.answers[q.id] ?? { textAnswer: "", selectedAnswers: [] };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: "دوراتي", href: "/v2/my-courses" },
          { label: "الدورة", href: backHref },
          { label: title },
        ]}
      >
        <AttemptTimer startedAt={flow.startedAt} timeLimitMin={flow.timeLimitMin} onExpire={flow.end} />
      </PageHeader>

      <Box sx={{ mb: 2 }}>
        <LinearProgress variant="determinate" value={((index + 1) / total) * 100} sx={{ borderRadius: 1, height: 6 }} />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          السؤال {index + 1} من {total}
        </Typography>
      </Box>

      <SectionCard subtitle={resolveQuestionTypeLabel(q.type)} title={q.question}>
        <QuestionInput question={q} value={value} onChange={(v) => flow.saveAnswer(q.id, v)} />
        {flow.savingQid === q.id && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            جارٍ الحفظ…
          </Typography>
        )}
      </SectionCard>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<MdArrowForward />}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          السابق
        </Button>
        {isLast ? (
          <Button variant="contained" color="primary" startIcon={<MdFlag />} onClick={flow.end} disabled={flow.busy}>
            إنهاء الاختبار
          </Button>
        ) : (
          <Button variant="contained" endIcon={<MdArrowBack />} onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}>
            التالي
          </Button>
        )}
      </Stack>
    </Container>
  );
}

export default TestTakerPage;
