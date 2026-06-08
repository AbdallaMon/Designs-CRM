"use client";

// ★ Test-taker attempt-flow hook (STAFF) — orchestrates the bespoke test-taking lifecycle on the
// staffCourses service (OWNER-scoped server-side):
//   1) load the test (getTest) + the caller's attempts (listAttempts) → decide RESUME vs START.
//      An in-progress attempt (no endTime) is resumed by reading it (getAttempt); otherwise the
//      attempt limit (test.attemptLimit) is checked in the UI ("لا توجد محاولات متبقية") — but the
//      server is trusted (startAttempt may still reject with ATTEMPT_LIMIT_REACHED).
//   2) startAttempt → load questions (getTestQuestions).
//   3) submitAnswer per question (autosave) — body { answer:{ textAnswer?, selectedAnswers[]? } }.
//   4) endAttempt → result (score / passed / "بانتظار التصحيح" when manual grading pending).
// Phase = idle | loading | ready | inProgress | submitting | finished | error. The page renders
// each phase. Mutations toast via runCoursesMutation; reads surface a resolved error.

import { useCallback, useEffect, useMemo, useState } from "react";
import { staffCoursesService } from "../../staffCourses.service.js";
import { runCoursesMutation } from "../../courses.mutations.js";

function isInProgress(attempt) {
  return attempt && !attempt.endTime && !attempt.endedAt;
}

export function useAttemptFlow(testId) {
  const [phase, setPhase] = useState("loading");
  const [error, setError] = useState(null);
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // questionId → { textAnswer?, selectedAnswers[] }
  const [savingQid, setSavingQid] = useState(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState([]);

  const loadQuestions = useCallback(async () => {
    const qRes = await staffCoursesService.getTestQuestions(testId);
    const qs = Array.isArray(qRes?.data) ? qRes.data : qRes?.data?.questions ?? qRes?.data?.items ?? [];
    setQuestions(qs);
    return qs;
  }, [testId]);

  // Resume: read the attempt (OWNER-scoped) → hydrate saved answers + questions.
  const resumeAttempt = useCallback(
    async (attemptId) => {
      setPhase("loading");
      try {
        const res = await staffCoursesService.getAttempt(testId, attemptId);
        const at = res?.data ?? null;
        setAttempt(at);
        await loadQuestions();
        // Hydrate previously-saved answers.
        const saved = {};
        (at?.answers ?? []).forEach((a) => {
          saved[a.questionId] = {
            textAnswer: a.textAnswer ?? "",
            selectedAnswers: (a.selectedAnswers ?? []).map((s) => s.value),
          };
        });
        setAnswers(saved);
        if (isInProgress(at)) setPhase("inProgress");
        else setPhase("finished");
      } catch (e) {
        setError(e?.data?.message || e?.message || "ATTEMPT_NOT_FOUND");
        setPhase("error");
      }
    },
    [testId, loadQuestions],
  );

  // Initial load: test + caller's attempts. Resume an in-progress attempt if present.
  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const [testRes, attemptsRes] = await Promise.all([
        staffCoursesService.getTest(testId),
        staffCoursesService.listAttempts(testId),
      ]);
      setTest(testRes?.data ?? null);
      const list = Array.isArray(attemptsRes?.data) ? attemptsRes.data : attemptsRes?.data?.items ?? [];
      setAttempts(list);
      const active = list.find(isInProgress);
      if (active) {
        await resumeAttempt(active.id);
      } else {
        setPhase("ready");
      }
    } catch (e) {
      setError(e?.data?.message || e?.message || "FETCH_FAILED");
      setPhase("error");
    }
  }, [testId, resumeAttempt]);

  useEffect(() => {
    load();
  }, [load]);

  const start = useCallback(async () => {
    setBusy(true);
    const res = await runCoursesMutation(() => staffCoursesService.startAttempt(testId), {
      loading: "جاري بدء المحاولة...",
      setLoading: setBusy,
    });
    if (res) {
      const at = res.data;
      setAttempt(at);
      await loadQuestions();
      setAnswers({});
      setPhase("inProgress");
    }
  }, [testId, loadQuestions]);

  // Autosave one answer (OWNER-scoped). Updates local state immediately, persists in background.
  const saveAnswer = useCallback(
    async (questionId, value) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (!attempt?.id) return;
      setSavingQid(questionId);
      await runCoursesMutation(
        () =>
          staffCoursesService.submitAnswer(testId, attempt.id, questionId, {
            textAnswer: value.textAnswer || undefined,
            selectedAnswers: value.selectedAnswers?.length ? value.selectedAnswers : undefined,
          }),
        { shouldAutoToast: false },
      );
      setSavingQid((q) => (q === questionId ? null : q));
    },
    [testId, attempt],
  );

  const end = useCallback(async () => {
    if (!attempt?.id) return;
    const res = await runCoursesMutation(() => staffCoursesService.endAttempt(testId, attempt.id), {
      loading: "جاري إنهاء المحاولة...",
      setLoading: setBusy,
    });
    if (res) {
      setAttempt(res.data ?? attempt);
      setPhase("finished");
    }
  }, [testId, attempt]);

  // Attempt-limit check (UI hint only; server is authoritative).
  const attemptsUsed = attempts.length;
  const attemptLimit = test?.attemptLimit ?? null;
  const noAttemptsLeft = attemptLimit != null && attemptsUsed >= attemptLimit && !attempt;

  // Optional timer (test.timeLimit minutes).
  const timeLimitMin = test?.timeLimit ?? null;
  const startedAt = attempt?.startTime ?? attempt?.createdAt ?? null;

  return useMemo(
    () => ({
      phase,
      error,
      test,
      attempt,
      questions,
      answers,
      savingQid,
      busy,
      attemptsUsed,
      attemptLimit,
      noAttemptsLeft,
      timeLimitMin,
      startedAt,
      reload: load,
      start,
      saveAnswer,
      end,
    }),
    [phase, error, test, attempt, questions, answers, savingQid, busy, attemptsUsed, attemptLimit, noAttemptsLeft, timeLimitMin, startedAt, load, start, saveAnswer, end],
  );
}

export default useAttemptFlow;
