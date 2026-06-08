"use client";

// Tests tab (course editor) — lazily lists the course's tests (listTests {key:"courseId",id}),
// supports create/edit/delete (COURSE.MANAGE), and expands a test to its question editor: a
// lazily-fetched test detail (getTest → test.questions) feeding <QuestionsEditor> (list / add /
// edit / delete / ★ reorder). All five read-states wired; mutations route through
// runCoursesMutation (CODE → Arabic toast). Arabic / RTL.

import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdExpandMore, MdAdd, MdEdit, MdDelete } from "react-icons/md";
import {
  SectionCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/app/v2/shared/components";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";
import { coursesMessages } from "@/app/v2/features/courses/config/coursesMessages.js";
import { useLazyResource } from "@/app/v2/features/courses/hooks/useLazyResource.js";
import { publishLabel, resolveTestTypeLabel } from "@/app/v2/features/courses/config/coursesConstants.js";
import { TestFormDialog } from "../TestFormDialog.jsx";
import { QuestionsEditor } from "../QuestionsEditor.jsx";
import { QuestionFormDialog } from "../QuestionFormDialog.jsx";

export function TestsTab({ courseId, canManage }) {
  const owner = { key: "courseId", id: courseId };
  const { data, isLoading, error, refetch } = useLazyResource(
    () => coursesService.listTests(owner),
    { deps: [courseId] },
  );
  const [dialog, setDialog] = useState({ open: false, test: null });
  const [busy, setBusy] = useState(false);

  const tests = Array.isArray(data) ? data : data?.items ?? [];

  async function deleteTest(test) {
    const res = await runCoursesMutation(() => coursesService.deleteTest(test.id), {
      loading: "جاري حذف الاختبار...",
      setLoading: setBusy,
    });
    if (res) refetch();
  }

  return (
    <Box>
      <SectionCard
        title="اختبارات الدورة"
        subtitle="أنشئ الاختبارات ثم حرّر أسئلتها ورتّبها."
        actions={
          canManage ? (
            <Button size="small" variant="contained" startIcon={<MdAdd />} onClick={() => setDialog({ open: true, test: null })}>
              إضافة اختبار
            </Button>
          ) : null
        }
      >
        {error ? (
          <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
        ) : isLoading ? (
          <LoadingState variant="form" fields={2} />
        ) : tests.length === 0 ? (
          <EmptyState
            title="لا توجد اختبارات بعد"
            description={canManage ? "أنشئ أول اختبار للدورة." : undefined}
            action={canManage ? { label: "إضافة اختبار", onClick: () => setDialog({ open: true, test: null }) } : undefined}
          />
        ) : (
          <Stack spacing={1.5}>
            {tests.map((test) => (
              <Accordion key={test.id} disableGutters TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary expandIcon={<MdExpandMore />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Typography sx={{ fontWeight: 600, flexGrow: 1 }}>
                      {test.title ?? `اختبار #${test.id}`}
                    </Typography>
                    <Chip size="small" variant="outlined" label={resolveTestTypeLabel(test.type)} />
                    <Chip size="small" label={publishLabel(test.published)} />
                    {canManage && (
                      <Box onClick={(e) => e.stopPropagation()} sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="تعديل الاختبار">
                          <IconButton size="small" onClick={() => setDialog({ open: true, test })}>
                            <MdEdit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف الاختبار">
                          <IconButton size="small" color="error" onClick={() => deleteTest(test)} disabled={busy}>
                            <MdDelete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TestPanel testId={test.id} canManage={canManage} />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}
      </SectionCard>

      {canManage && (
        <TestFormDialog
          open={dialog.open}
          owner={owner}
          test={dialog.test}
          onClose={() => setDialog({ open: false, test: null })}
          onSaved={() => {
            setDialog({ open: false, test: null });
            refetch();
          }}
        />
      )}
    </Box>
  );
}

// One expanded test: lazily fetch its detail (questions) and feed the question editor.
function TestPanel({ testId, canManage }) {
  const { data, isLoading, error, refetch } = useLazyResource(
    () => coursesService.getTest(testId),
    { deps: [testId] },
  );
  const [qDialog, setQDialog] = useState({ open: false, question: null });

  const questions = data?.questions ?? data?.test?.questions ?? [];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2">الأسئلة</Typography>
        {canManage && (
          <Button size="small" variant="outlined" startIcon={<MdAdd />} onClick={() => setQDialog({ open: true, question: null })}>
            إضافة سؤال
          </Button>
        )}
      </Stack>

      {error ? (
        <ErrorState error={error} onRetry={refetch} resolver={coursesMessages} />
      ) : isLoading ? (
        <LoadingState variant="form" fields={2} />
      ) : (
        <QuestionsEditor
          testId={testId}
          questions={questions}
          canManage={canManage}
          onEdit={(q) => setQDialog({ open: true, question: q })}
          onChanged={refetch}
        />
      )}

      {canManage && (
        <QuestionFormDialog
          open={qDialog.open}
          testId={testId}
          question={qDialog.question}
          onClose={() => setQDialog({ open: false, question: null })}
          onSaved={() => {
            setQDialog({ open: false, question: null });
            refetch();
          }}
        />
      )}
    </Box>
  );
}

export default TestsTab;
