"use client";

// <StageStepper stages current /> — a themed MUI Stepper for multi-stage flows (lead
// sales-stages, contract lifecycle, image-session steps). RTL is handled by MUI under the rtl
// emotion cache; we don't manually reverse. Phase 0 ships the primitive; features wire their
// own stage data + advance/rollback CTAs later. Single-language Arabic / RTL.
//
// Props:
//   stages   ({ key, label, optional? } | string)[] — ordered stage list (strings are labels).
//   current  number|string — active stage index, OR a stage key to resolve to its index.
//   completedUpTo number?  — mark all stages before this index as completed (default = current).
//   orientation "horizontal" | "vertical" (default horizontal).
//   alternativeLabel bool   — labels under the connectors (default true for horizontal).

import { Stepper, Step, StepLabel } from "@mui/material";

function normalize(stages) {
  return stages.map((s, i) =>
    typeof s === "string" ? { key: String(i), label: s } : s,
  );
}

export function StageStepper({
  stages = [],
  current = 0,
  completedUpTo,
  orientation = "horizontal",
  alternativeLabel,
}) {
  const items = normalize(stages);
  const activeIndex =
    typeof current === "number"
      ? current
      : Math.max(
          0,
          items.findIndex((s) => s.key === current),
        );
  const doneBefore = completedUpTo ?? activeIndex;

  return (
    <Stepper
      activeStep={activeIndex}
      orientation={orientation}
      alternativeLabel={
        alternativeLabel ?? orientation === "horizontal"
      }
      sx={{ "& .MuiStepConnector-line": { borderColor: "divider" } }}
    >
      {items.map((s, i) => (
        <Step key={s.key} completed={i < doneBefore}>
          <StepLabel optional={s.optional}>{s.label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}

export default StageStepper;
