"use client";

// VersaPanel — the lead-scoped VERSA objection-handling surface (§3.5). Flow:
//   1. category list             → getVersaCategories(clientLeadId)            [question.session.view]
//   2. expand a category → steps → getVersaByCategory(clientLeadId,categoryId)  [question.session.view]
//      rendered as an editable objection→response accordion.
//   3. create VERSA for a cat.   → createVersa(clientLeadId,categoryId)         [question.versa.manage]
//   4. edit a step               → updateVersaStep(stepId,{label?,question?,answer?,clientResponse?}) [question.versa.manage]
//
// LEAD-SCOPED: the BE resolves+checks the parent lead before any read/write (the dtos emit NO
// capabilities.*), so writes gate on the QUESTION.* CODES only; the server is the source of
// truth. updateVersaStep whitelists exactly the BE .strict() keys (handled by the service).
// Steps load imperatively per expanded category (getVersaByCategory needs the categoryId, not a
// static URL useRequest can autoFetch). Single Arabic / RTL.

import { useEffect, useMemo, useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, CircularProgress, Stack,
  TextField, Typography,
} from "@mui/material";
import { MdExpandMore, MdAdd } from "react-icons/md";
import { usePermission } from "@/app/v2/hooks/usePermission";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { PERMISSIONS } from "@/app/v2/config/permissions";
import {
  SectionCard, LoadingState, EmptyState, ErrorState,
} from "@/app/v2/shared/components";
import { versaCategoriesUrl } from "../config/constant.js";
import questionsService from "../questions.service.js";
import { runQuestionsMutation } from "../questions.mutations.js";
import { questionsMessages } from "../config/questionsMessages.js";

const P = PERMISSIONS.QUESTION;

const categoryLabel = (c) => c?.title ?? c?.name ?? c?.label ?? c?.key ?? `#${c?.id}`;

// A VERSA step's objection (question) + response (answer/clientResponse). The BE allows editing
// label / question / answer / clientResponse; we surface objection (question) + response (answer).
function StepEditor({ step, canManage, busy, onSave }) {
  const [question, setQuestion] = useState(step.question ?? step.label ?? "");
  const [answer, setAnswer] = useState(step.answer ?? step.clientResponse ?? "");

  useEffect(() => {
    setQuestion(step.question ?? step.label ?? "");
    setAnswer(step.answer ?? step.clientResponse ?? "");
  }, [step]);

  const dirty =
    question !== (step.question ?? step.label ?? "") ||
    answer !== (step.answer ?? step.clientResponse ?? "");

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}>
      <Stack spacing={1}>
        <TextField
          fullWidth
          size="small"
          label="الاعتراض"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!canManage || busy}
        />
        <TextField
          fullWidth
          multiline
          minRows={2}
          size="small"
          label="الرد"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!canManage || busy}
        />
        {canManage && (
          <Box sx={{ textAlign: "start" }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => onSave({ question, answer })}
              disabled={busy || !dirty}
            >
              حفظ
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function CategoryAccordion({ clientLeadId, category, canManage, expanded, onToggle }) {
  const [steps, setSteps] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await questionsService.getVersaByCategory(clientLeadId, category.id);
      const d = res?.data;
      // Tolerant extraction: a bare array, or { steps } / { items } / { versa: { steps } }.
      const stepsList = Array.isArray(d)
        ? d
        : d?.steps ?? d?.items ?? d?.versa?.steps ?? [];
      setSteps(Array.isArray(stepsList) ? stepsList : []);
    } catch (e) {
      setError(e?.data?.message || e?.message || "ERROR");
    } finally {
      setLoading(false);
    }
  }

  // Lazy-load steps the first time the category expands.
  useEffect(() => {
    if (expanded && steps === null && !loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  async function createVersa() {
    const res = await runQuestionsMutation(
      () => questionsService.createVersa(clientLeadId, category.id),
      { loading: "جاري إنشاء معالجة الاعتراضات...", setLoading: setBusy },
    );
    if (res) load();
  }

  async function saveStep(stepId, { question, answer }) {
    const res = await runQuestionsMutation(
      () => questionsService.updateVersaStep(stepId, { question, answer }),
      { loading: "جاري حفظ الخطوة...", setLoading: setBusy },
    );
    if (res) load();
  }

  return (
    <Accordion expanded={expanded} onChange={onToggle} disableGutters>
      <AccordionSummary expandIcon={<MdExpandMore />}>
        <Typography variant="subtitle1">{categoryLabel(category)}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        ) : error ? (
          <ErrorState error={error} onRetry={load} resolver={questionsMessages} />
        ) : !steps?.length ? (
          <EmptyState
            title="لا توجد خطوات معالجة"
            description={
              canManage
                ? "أنشئ معالجة الاعتراضات لهذه الفئة."
                : "لم تُنشأ معالجة اعتراضات لهذه الفئة بعد."
            }
            action={
              canManage
                ? { label: "إنشاء معالجة", onClick: createVersa, icon: <MdAdd /> }
                : undefined
            }
          />
        ) : (
          <Stack spacing={1.5}>
            {steps.map((s) => (
              <StepEditor
                key={s.id}
                step={s}
                canManage={canManage}
                busy={busy}
                onSave={(patch) => saveStep(s.id, patch)}
              />
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export function VersaPanel({ clientLeadId }) {
  const { hasPermission } = usePermission();
  const canView = hasPermission(P.SESSION_VIEW);
  const canManage = hasPermission(P.VERSA_MANAGE);

  const hasLead = Boolean(clientLeadId);
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading, error, refetch } = useRequest({
    url: hasLead ? versaCategoriesUrl(clientLeadId) : "",
    method: "get",
    autoFetch: canView && hasLead,
  });
  const categories = useMemo(
    () => (Array.isArray(data) ? data : data?.items ?? data?.categories ?? []),
    [data],
  );

  if (!canView) {
    return (
      <SectionCard title="معالجة الاعتراضات (VERSA)">
        <EmptyState
          title="لا تملك صلاحية عرض معالجة الاعتراضات"
          description="تواصل مع المسؤول لمنحك صلاحية الاطلاع على VERSA لهذا العميل."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="معالجة الاعتراضات (VERSA)"
      subtitle="اختر فئة لعرض الاعتراضات وردودها وتحريرها."
    >
      {isLoading ? (
        <LoadingState variant="form" fields={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} resolver={questionsMessages} />
      ) : categories.length === 0 ? (
        <EmptyState title="لا توجد فئات" description="لم تُعرّف فئات معالجة الاعتراضات بعد." />
      ) : (
        <Box>
          {categories.map((c) => (
            <CategoryAccordion
              key={c.id}
              clientLeadId={clientLeadId}
              category={c}
              canManage={canManage}
              expanded={expandedId === c.id}
              onToggle={() => setExpandedId((prev) => (prev === c.id ? null : c.id))}
            />
          ))}
        </Box>
      )}
    </SectionCard>
  );
}

export default VersaPanel;
