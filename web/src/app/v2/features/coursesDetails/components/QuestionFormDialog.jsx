"use client";

// Create / edit test-question modal — RHF-free local state (the choices array is dynamic). Body:
// create → { type, question, choices[] }; edit → { question, choices[] } (type is fixed on edit
// per the BE contract). A choice is { text, value, isCorrect } (mirrors TestChoice). Choice-based
// types show an editable choice list with a correct-answer marker; TEXT shows none. Submits via
// coursesService.createQuestion / .updateQuestion through runCoursesMutation. Gated at the call
// site on COURSE.MANAGE. Arabic / RTL.

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import { coursesService } from "@/app/v2/features/courses/courses.service.js";
import { runCoursesMutation } from "@/app/v2/features/courses/courses.mutations.js";
import {
  QUESTION_TYPE_OPTIONS,
  CHOICE_QUESTION_TYPES,
} from "@/app/v2/features/courses/config/coursesConstants.js";

function toChoices(question) {
  if (Array.isArray(question?.choices) && question.choices.length) {
    return question.choices.map((c) => ({
      text: c.text ?? "",
      value: c.value ?? c.text ?? "",
      isCorrect: Boolean(c.isCorrect),
    }));
  }
  return [{ text: "", value: "", isCorrect: false }];
}

export function QuestionFormDialog({ open, onClose, testId, question, onSaved }) {
  const isEdit = Boolean(question?.id);
  const [type, setType] = useState(question?.type ?? "SINGLE_CHOICE");
  const [text, setText] = useState(question?.question ?? "");
  const [choices, setChoices] = useState(toChoices(question));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setType(question?.type ?? "SINGLE_CHOICE");
    setText(question?.question ?? "");
    setChoices(toChoices(question));
  }, [question, open]);

  const isChoiceType = CHOICE_QUESTION_TYPES.includes(type);

  function setChoice(i, patch) {
    setChoices((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addChoice() {
    setChoices((prev) => [...prev, { text: "", value: "", isCorrect: false }]);
  }
  function removeChoice(i) {
    setChoices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    const cleanChoices = isChoiceType
      ? choices
          .filter((c) => String(c.text).trim() !== "")
          .map((c) => ({ text: c.text.trim(), value: (c.value || c.text).trim(), isCorrect: Boolean(c.isCorrect) }))
      : [];
    const base = { question: text.trim(), choices: cleanChoices };
    const res = await runCoursesMutation(
      () =>
        isEdit
          ? coursesService.updateQuestion(testId, question.id, base)
          : coursesService.createQuestion(testId, { type, ...base }),
      { loading: isEdit ? "جاري تحديث السؤال..." : "جاري إضافة السؤال...", setLoading: setSubmitting },
    );
    if (res) {
      onSaved?.(res.data);
      onClose?.();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth dir="rtl">
      <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
        {isEdit ? "تعديل السؤال" : "إضافة سؤال"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            select
            label="نوع السؤال"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isEdit}
            fullWidth
          >
            {QUESTION_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="نص السؤال"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          {isChoiceType && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                الخيارات (علّم الإجابة الصحيحة)
              </Typography>
              <Stack spacing={1.5}>
                {choices.map((c, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <TextField
                      size="small"
                      label={`الخيار ${i + 1}`}
                      value={c.text}
                      onChange={(e) => setChoice(i, { text: e.target.value })}
                      fullWidth
                    />
                    <FormControlLabel
                      sx={{ m: 0, whiteSpace: "nowrap" }}
                      control={
                        <Checkbox checked={Boolean(c.isCorrect)} onChange={(e) => setChoice(i, { isCorrect: e.target.checked })} />
                      }
                      label="صحيح"
                    />
                    <IconButton size="small" color="error" onClick={() => removeChoice(i)}>
                      <MdDelete />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Button size="small" startIcon={<MdAdd />} onClick={addChoice} sx={{ mt: 1 }}>
                إضافة خيار
              </Button>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Button onClick={onClose} variant="outlined" disabled={submitting}>
          إلغاء
        </Button>
        <Button onClick={submit} variant="contained" color="primary" disabled={submitting || !text.trim()}>
          {isEdit ? "حفظ" : "إضافة"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuestionFormDialog;
