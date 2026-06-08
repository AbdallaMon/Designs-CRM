"use client";

// <QuestionsEditor> — manages ONE test's questions: list, add/edit/delete, and ★ REORDER. The
// reorder is light (up/down buttons — no heavy dnd dependency, per spec): each move reorders the
// local array optimistically then persists the new order via coursesService.reorderQuestions,
// whose body is an ARRAY of { id } (the contract). On failure it reverts. Questions come from
// the admin test detail (getTest → test.questions) — there is no separate admin question-list
// read. Gated on COURSE.MANAGE (canManage). Arabic / RTL.

import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { MdArrowUpward, MdArrowDownward, MdEdit, MdDelete } from "react-icons/md";
import { EmptyState } from "@/app/v2/shared/components";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";
import { resolveQuestionTypeLabel } from "@/app/v2/features/courses/config/coursesConstants.js";

export function QuestionsEditor({ testId, questions = [], canManage, onEdit, onChanged }) {
  const [list, setList] = useState(questions);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setList(questions);
  }, [questions]);

  async function persistOrder(next, prev) {
    setList(next); // optimistic
    const res = await runCoursesMutation(
      () => coursesService.reorderQuestions(testId, next.map((q) => ({ id: q.id }))),
      { loading: "جاري إعادة ترتيب الأسئلة...", setLoading: setBusy },
    );
    if (!res) setList(prev); // revert
    else onChanged?.();
  }

  function move(index, dir) {
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    const prev = list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next, prev);
  }

  async function remove(q) {
    const res = await runCoursesMutation(
      () => coursesService.deleteQuestion(testId, q.id),
      { loading: "جاري حذف السؤال...", setLoading: setBusy },
    );
    if (res) onChanged?.();
  }

  if (list.length === 0) {
    return <EmptyState title="لا توجد أسئلة" description={canManage ? "أضف أول سؤال للاختبار." : undefined} />;
  }

  return (
    <List disablePadding>
      {list.map((q, i) => (
        <ListItem
          key={q.id}
          divider
          secondaryAction={
            canManage ? (
              <Stack direction="row" spacing={0.25} alignItems="center">
                <Tooltip title="تحريك لأعلى">
                  <span>
                    <IconButton size="small" onClick={() => move(i, -1)} disabled={busy || i === 0}>
                      <MdArrowUpward />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="تحريك لأسفل">
                  <span>
                    <IconButton size="small" onClick={() => move(i, 1)} disabled={busy || i === list.length - 1}>
                      <MdArrowDownward />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="تعديل">
                  <IconButton size="small" onClick={() => onEdit?.(q)}>
                    <MdEdit />
                  </IconButton>
                </Tooltip>
                <Tooltip title="حذف">
                  <IconButton size="small" color="error" onClick={() => remove(q)} disabled={busy}>
                    <MdDelete />
                  </IconButton>
                </Tooltip>
              </Stack>
            ) : null
          }
        >
          <Box sx={{ minWidth: 0, pe: canManage ? 18 : 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
              <Chip size="small" label={i + 1} />
              <Chip size="small" variant="outlined" label={resolveQuestionTypeLabel(q.type)} />
            </Stack>
            <Typography variant="body2">{q.question}</Typography>
          </Box>
        </ListItem>
      ))}
    </List>
  );
}

export default QuestionsEditor;
