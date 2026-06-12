"use client";

// SPIN session-questions board for a single lead — the question TYPES (SITUATION / PROBLEM /
// IMPLICATION / NEED_PAYOFF) each as a section, and under each its session questions with an
// answer/edit field. LEAD-SCOPED: the parent lead is fixed (clientLeadId prop); the backend
// enforces the lead object-scope on every read/write (the dto emits NO capabilities.*), so the
// answer action gates purely on the QUESTION.ANSWER_SUBMIT CODE — the server is the source of
// truth.
//
// Backend contract bound (server/src/modules/questions/questions.{route,repository}.js):
//   • GET /question-types/:leadId               → [{ id, name, label, baseQuestions[] }]   (also SEEDS session rows)
//   • GET /session-questions/:leadId?questionTypeId=  → [{ id, title, isCustom, order, questionTypeId,
//                                                        questionType:{id,name,label}, answer:{response}|null }]
//       NOTE: questionTypeId is REQUIRED by the BE query schema → one fetch PER type.
//   • POST /:sessionQuestionId/answer  body(.strict): { response }  → upserts the Answer.
//
// The types board is rendered by the parent (it owns the question-types fetch). Each
// TypeSection lazily fetches that type's session questions via useRequest.

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdExpandMore, MdCheckCircle } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { useToastContext } from "@/app/v2/providers/ToastProvider";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import { sessionQuestionsUrl } from "../config/constant.js";
import { questionsService } from "../questions.service.js";
import { runQuestionsMutation } from "../questions.mutations.js";
import {
  labelForType,
  sortQuestionTypes,
  normalizeSessionQuestion,
} from "../config/questionsConfig.js";

const P = PERMISSIONS.QUESTION;

export function SessionQuestionsBoard({ clientLeadId, types, canAnswer }) {
  const ordered = sortQuestionTypes(types);

  if (ordered.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        لا توجد أنواع أسئلة معرّفة بعد.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {ordered.map((type, idx) => (
        <TypeSection
          key={type.id ?? type.name}
          clientLeadId={clientLeadId}
          type={type}
          canAnswer={canAnswer}
          defaultExpanded={idx === 0}
        />
      ))}
    </Box>
  );
}

// ── One question-TYPE section (lazily fetches its session questions for the lead) ─────────
function TypeSection({ clientLeadId, type, canAnswer, defaultExpanded }) {
  // Embed the required questionTypeId in the path (apiFetch.get ignores a params arg → the
  // service/constant pattern carries the query in the URL).
  const url = `${sessionQuestionsUrl(clientLeadId)}?questionTypeId=${type.id}`;
  const { data, isLoading, error, refetch } = useRequest({
    url,
    method: "get",
    autoFetch: true,
  });

  const rows = (Array.isArray(data) ? data : data?.items ?? []).map(normalizeSessionQuestion);
  const answeredCount = rows.filter((r) => r.isAnswered).length;

  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters>
      <AccordionSummary expandIcon={<MdExpandMore />}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {labelForType(type)}
          </Typography>
          {rows.length > 0 && (
            <Chip
              size="small"
              color={answeredCount === rows.length ? "success" : "default"}
              label={`${answeredCount} / ${rows.length} مُجاب`}
            />
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!isLoading && error && (
          <Alert severity="error">تعذر جلب أسئلة هذا القسم. حاول مرة أخرى.</Alert>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            لا توجد أسئلة في هذا القسم.
          </Typography>
        )}

        {!isLoading && !error && rows.length > 0 && (
          <Stack spacing={2}>
            {rows.map((q) => (
              <QuestionRow
                key={q.id}
                question={q}
                canAnswer={canAnswer}
                onSaved={refetch}
              />
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// ── One session question + its answer/edit field ─────────────────────────────────────────
function QuestionRow({ question, canAnswer, onSaved }) {
  const { setLoading } = useToastContext();
  const [value, setValue] = useState(question.response ?? "");
  const [busy, setBusy] = useState(false);

  // Keep the field in sync when the row is re-fetched (e.g. after a save elsewhere).
  useEffect(() => {
    setValue(question.response ?? "");
  }, [question.response]);

  const trimmed = value.trim();
  const dirty = trimmed !== (question.response ?? "").trim();
  const canSubmit = canAnswer && trimmed.length > 0 && dirty && !busy;

  async function save() {
    if (!canSubmit) return;
    setBusy(true);
    const res = await runQuestionsMutation(
      () => questionsService.submitAnswer(question.id, { response: trimmed }),
      { setLoading, loading: "جاري حفظ الإجابة..." },
    );
    setBusy(false);
    if (res) onSaved?.();
  }

  return (
    <Box sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}>
      <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
        {question.isAnswered && (
          <Box sx={{ color: "success.main", pt: "2px" }}>
            <MdCheckCircle size={18} />
          </Box>
        )}
        <Typography sx={{ fontWeight: 600 }}>{question.title}</Typography>
        {question.isCustom && <Chip size="small" variant="outlined" label="مخصص" />}
      </Stack>

      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        label="الإجابة"
        placeholder={canAnswer ? "اكتب إجابة العميل..." : "لا تملك صلاحية الإجابة"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!canAnswer || busy}
      />

      {canAnswer && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
          <Button variant="contained" size="small" onClick={save} disabled={!canSubmit}>
            {question.isAnswered ? "تحديث الإجابة" : "حفظ الإجابة"}
          </Button>
        </Stack>
      )}
    </Box>
  );
}

export default SessionQuestionsBoard;
