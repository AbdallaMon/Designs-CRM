"use client";

// SpinPanel — the lead-scoped SPIN session-questions surface (§3.5). Flow:
//   1. question-type selector       → getQuestionTypes(clientLeadId)        [question.config.view]
//   2. per-type session questions   → getSessionQuestions(clientLeadId,{questionTypeId}) [question.session.view]
//   3. inline answer per question   → submitAnswer(sessionQuestionId,{response})  [question.answer.submit]
//      OR bulk-save all dirty edits → submitBulkAnswers([{sessionQuestionId,response}]) [question.answer.submit]
//   4. add a custom question        → createCustomQuestion(clientLeadId,{questionTypeId,title}) [question.custom.create]
//
// LEAD-SCOPED: the BE resolves+checks the parent lead before any read/write (the dtos emit NO
// capabilities.*), so writes gate on the QUESTION.* CODES only; the server is the source of
// truth. Write bodies are shaped by the service to the BE .strict() schemas. Single Arabic / RTL.

import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton,
  Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import { MdAdd, MdSave } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { useT } from "@/app/v2/lib/i18n";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  SectionCard, LoadingState, EmptyState, ErrorState,
} from "@/app/v2/shared/components";
import {
  questionTypesUrl, sessionQuestionsUrl,
} from "../config/constant.js";
import questionsService from "../questions.service.js";
import { runQuestionsMutation } from "../questions.mutations.js";
import { questionsMessages } from "../config/questionsMessages.js";

const P = PERMISSIONS.QUESTION;

const typeLabel = (t) => t?.title ?? t?.name ?? t?.key ?? (t?.id != null ? `#${t.id}` : "");
const questionLabel = (q) => q?.title ?? q?.question ?? q?.text ?? q?.key ?? `#${q?.id}`;
const questionAnswer = (q) => q?.response ?? q?.answer ?? q?.value ?? "";

function CustomQuestionDialog({ open, onClose, onSave, busy }) {
  const { t } = useT();
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (open) setTitle("");
  }, [open]);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" dir="rtl">
      <DialogTitle>{t("questions.spin.dialog.title", "سؤال مخصص")}</DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={2}
          label={t("questions.spin.dialog.questionLabel", "نص السؤال")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t("questions.spin.dialog.cancel", "إلغاء")}
        </Button>
        <Button
          variant="contained"
          onClick={() => onSave(title.trim())}
          disabled={busy || title.trim().length === 0}
        >
          {t("questions.spin.dialog.add", "إضافة")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function SpinPanel({ clientLeadId }) {
  const { t } = useT();
  const { hasPermission } = usePermission();
  const canViewConfig = hasPermission(P.CONFIG_VIEW);
  const canViewSession = hasPermission(P.SESSION_VIEW);
  const canAnswer = hasPermission(P.ANSWER_SUBMIT);
  const canCreateCustom = hasPermission(P.CUSTOM_CREATE);

  const hasLead = Boolean(clientLeadId);
  const [activeTypeId, setActiveTypeId] = useState(null);
  const [drafts, setDrafts] = useState({}); // sessionQuestionId -> edited response
  const [busy, setBusy] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  // 1. question-type config (lead-scoped read).
  const {
    data: typesData, isLoading: typesLoading, error: typesError, refetch: refetchTypes,
  } = useRequest({
    url: hasLead ? questionTypesUrl(clientLeadId) : "",
    method: "get",
    autoFetch: canViewConfig && hasLead,
  });
  const types = useMemo(
    () => (Array.isArray(typesData) ? typesData : typesData?.items ?? typesData?.types ?? []),
    [typesData],
  );

  // Default to the first type once loaded.
  useEffect(() => {
    if (activeTypeId == null && types.length) setActiveTypeId(types[0].id);
  }, [types, activeTypeId]);

  // 2. session questions for the active type (lead-scoped read; refetch on type change).
  const sessionUrl = useMemo(() => {
    if (!hasLead || activeTypeId == null) return "";
    const base = sessionQuestionsUrl(clientLeadId);
    return `${base}?questionTypeId=${encodeURIComponent(activeTypeId)}`;
  }, [hasLead, clientLeadId, activeTypeId]);

  const {
    data: questionsData, isLoading: qLoading, error: qError, refetch: refetchQuestions,
  } = useRequest({
    url: sessionUrl,
    method: "get",
    autoFetch: canViewSession && Boolean(sessionUrl),
  });
  const questions = useMemo(
    () =>
      Array.isArray(questionsData)
        ? questionsData
        : questionsData?.items ?? questionsData?.questions ?? [],
    [questionsData],
  );

  // Reset drafts whenever the loaded question set changes.
  useEffect(() => {
    setDrafts({});
  }, [questionsData]);

  const setDraft = (id, value) => setDrafts((d) => ({ ...d, [id]: value }));
  const draftFor = (q) => (q.id in drafts ? drafts[q.id] : questionAnswer(q));

  const dirtyAnswers = useMemo(
    () =>
      questions
        .filter((q) => q.id in drafts && (drafts[q.id] ?? "") !== (questionAnswer(q) ?? ""))
        .map((q) => ({ sessionQuestionId: q.id, response: drafts[q.id] ?? "" })),
    [questions, drafts],
  );

  async function saveOne(q) {
    const res = await runQuestionsMutation(
      () => questionsService.submitAnswer(q.id, { response: draftFor(q) }),
      { loading: t("questions.spin.savingAnswer", "جاري حفظ الإجابة..."), setLoading: setBusy },
    );
    if (res) refetchQuestions();
  }

  async function saveAll() {
    if (!dirtyAnswers.length) return;
    const res = await runQuestionsMutation(
      () => questionsService.submitBulkAnswers(dirtyAnswers),
      { loading: t("questions.spin.savingAnswers", "جاري حفظ الإجابات..."), setLoading: setBusy },
    );
    if (res) refetchQuestions();
  }

  async function createCustom(title) {
    if (!title || activeTypeId == null) return;
    const res = await runQuestionsMutation(
      () =>
        questionsService.createCustomQuestion(clientLeadId, {
          questionTypeId: activeTypeId,
          title,
        }),
      { loading: t("questions.spin.addingQuestion", "جاري إضافة السؤال..."), setLoading: setBusy },
    );
    if (res) {
      setCustomOpen(false);
      refetchQuestions();
    }
  }

  if (!canViewConfig && !canViewSession) {
    return (
      <SectionCard title={t("questions.spin.title", "أسئلة SPIN")}>
        <EmptyState
          title={t("questions.noViewPermission", "لا تملك صلاحية عرض أسئلة العميل")}
          description={t(
            "questions.spin.noViewPermissionDescription",
            "تواصل مع المسؤول لمنحك صلاحية الاطلاع على أسئلة SPIN لهذا العميل.",
          )}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("questions.spin.title", "أسئلة SPIN")}
      subtitle={t("questions.spin.subtitle", "اختر نوع السؤال ثم سجّل إجابات العميل.")}
      actions={
        canAnswer ? (
          <Button
            variant="contained"
            size="small"
            startIcon={<MdSave />}
            onClick={saveAll}
            disabled={busy || dirtyAnswers.length === 0}
          >
            {dirtyAnswers.length
              ? t("questions.spin.saveAllCount", "حفظ الكل ({count})").replace(
                  "{count}",
                  dirtyAnswers.length,
                )
              : t("questions.spin.saveAll", "حفظ الكل")}
          </Button>
        ) : null
      }
    >
      {canCreateCustom && (
        <CustomQuestionDialog
          open={customOpen}
          onClose={() => setCustomOpen(false)}
          onSave={createCustom}
          busy={busy}
        />
      )}

      {/* Type selector */}
      {typesLoading ? (
        <LoadingState variant="form" fields={2} />
      ) : typesError ? (
        <ErrorState error={typesError} onRetry={refetchTypes} resolver={questionsMessages} />
      ) : types.length === 0 ? (
        <EmptyState
          title={t("questions.spin.noTypesTitle", "لا توجد أنواع أسئلة")}
          description={t("questions.spin.noTypesDescription", "لم تُعرّف أنواع أسئلة SPIN بعد.")}
        />
      ) : (
        <Stack spacing={2}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={activeTypeId}
            onChange={(_e, v) => {
              if (v != null) setActiveTypeId(v);
            }}
            sx={{ flexWrap: "wrap" }}
          >
            {types.map((t) => (
              <ToggleButton key={t.id} value={t.id}>
                {typeLabel(t)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Divider />

          {/* Questions for the active type */}
          {qLoading ? (
            <LoadingState variant="form" fields={4} />
          ) : qError ? (
            <ErrorState error={qError} onRetry={refetchQuestions} resolver={questionsMessages} />
          ) : questions.length === 0 ? (
            <EmptyState
              title={t("questions.spin.noQuestionsTitle", "لا توجد أسئلة لهذا النوع")}
              description={
                canCreateCustom
                  ? t("questions.spin.noQuestionsAddHint", "أضف سؤالاً مخصصاً للبدء.")
                  : t("questions.spin.noQuestionsDescription", "لم تُضَف أسئلة لهذا النوع بعد.")
              }
              action={
                canCreateCustom
                  ? {
                      label: t("questions.spin.customQuestion", "سؤال مخصص"),
                      onClick: () => setCustomOpen(true),
                      icon: <MdAdd />,
                    }
                  : undefined
              }
            />
          ) : (
            <Stack spacing={2}>
              {questions.map((q) => (
                <Box key={q.id}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {questionLabel(q)}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <TextField
                      fullWidth
                      multiline
                      minRows={1}
                      size="small"
                      placeholder={t("questions.spin.answerPlaceholder", "إجابة العميل")}
                      value={draftFor(q)}
                      onChange={(e) => setDraft(q.id, e.target.value)}
                      disabled={!canAnswer || busy}
                    />
                    {canAnswer && (
                      <Tooltip title={t("questions.spin.saveAnswer", "حفظ الإجابة")}>
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => saveOne(q)}
                            disabled={
                              busy || (draftFor(q) ?? "") === (questionAnswer(q) ?? "")
                            }
                            aria-label={t("questions.spin.saveAnswer", "حفظ الإجابة")}
                            sx={{ mt: 0.25 }}
                          >
                            <MdSave />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
              ))}
              {canCreateCustom && (
                <Box>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<MdAdd />}
                    onClick={() => setCustomOpen(true)}
                    disabled={busy}
                  >
                    {t("questions.spin.customQuestion", "سؤال مخصص")}
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Stack>
      )}
    </SectionCard>
  );
}

export default SpinPanel;
