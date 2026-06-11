"use client";

// <QuestionInput> — renders ONE test question's answer input by type and reports the change up as
// the attempt-flow answer shape { textAnswer?, selectedAnswers[] } (the BE submitAnswer body).
//   • SINGLE_CHOICE / TRUE_FALSE → radio (selectedAnswers = [value]).
//   • MULTIPLE_CHOICE            → checkboxes (selectedAnswers = [values]).
//   • ORDERING                   → checkboxes for now (selectedAnswers = chosen values).
//   • TEXT                       → free text (textAnswer).
// Choice value is choice.value (fallback choice.text). Single-language Arabic / RTL.

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import {
  CHOICE_QUESTION_TYPES,
  MULTI_SELECT_QUESTION_TYPES,
} from "../../config/coursesConstants.js";

function choiceValue(c) {
  return c.value ?? c.text ?? String(c.id);
}

export function QuestionInput({ question, value, onChange }) {
  const selected = value?.selectedAnswers ?? [];
  const text = value?.textAnswer ?? "";
  const isChoice = CHOICE_QUESTION_TYPES.includes(question.type);
  const isMulti = MULTI_SELECT_QUESTION_TYPES.includes(question.type);
  const choices = question.choices ?? [];

  if (!isChoice) {
    return (
      <TextField
        fullWidth
        multiline
        minRows={3}
        label="إجابتك"
        value={text}
        onChange={(e) => onChange({ textAnswer: e.target.value, selectedAnswers: [] })}
      />
    );
  }

  if (isMulti) {
    function toggle(v, checked) {
      const next = checked ? [...selected, v] : selected.filter((x) => x !== v);
      onChange({ textAnswer: "", selectedAnswers: next });
    }
    return (
      <FormGroup>
        {choices.map((c) => {
          const v = choiceValue(c);
          return (
            <FormControlLabel
              key={c.id ?? v}
              control={<Checkbox checked={selected.includes(v)} onChange={(e) => toggle(v, e.target.checked)} />}
              label={c.text ?? v}
            />
          );
        })}
      </FormGroup>
    );
  }

  // single choice / true-false
  return (
    <FormControl>
      <RadioGroup
        value={selected[0] ?? ""}
        onChange={(e) => onChange({ textAnswer: "", selectedAnswers: [e.target.value] })}
      >
        {choices.map((c) => {
          const v = choiceValue(c);
          return <FormControlLabel key={c.id ?? v} value={v} control={<Radio />} label={c.text ?? v} />;
        })}
      </RadioGroup>
    </FormControl>
  );
}

export default QuestionInput;
