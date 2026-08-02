"use client";
import { useState } from "react";
import { Tab, Tabs, Box } from "@mui/material";
import { useAuth } from "@/app/providers/AuthProvider";
import { PROJECT_TYPES_ENUM } from "@/app/helpers/constants";
import WorkStagesKanban from "@/features/work-stages/WorkStageKanban";
// ⏸️ My Day disabled 2026-07-16 (user request) — un-comment with the My Day page + nav row.
// import MyDayStrip from "@/features/my-day/MyDayStrip.jsx";

const TWO_D_STAGES = [
  { key: PROJECT_TYPES_ENUM.TwoD.STUDY, label: "Study" },
  { key: PROJECT_TYPES_ENUM.TwoD.FINAL_PLANS, label: "Final Plans" },
  { key: PROJECT_TYPES_ENUM.TwoD.QUANTITY_CALCULATION, label: "Quantity" },
];
const STAGE_PREF_KEY = "work-stages:2d-stage";

// Unified 2D board: all stage types behind tabs so the main entry point is never
// blank (the per-stage routes under /work-stages/* remain).
function TwoDBoard() {
  const [stage, setStage] = useState(() => {
    if (typeof window === "undefined") return TWO_D_STAGES[0].key;
    const saved = window.localStorage.getItem(STAGE_PREF_KEY);
    return TWO_D_STAGES.some((s) => s.key === saved) ? saved : TWO_D_STAGES[0].key;
  });
  const handleChange = (e, value) => {
    setStage(value);
    try {
      window.localStorage.setItem(STAGE_PREF_KEY, value);
    } catch {}
  };
  return (
    <>
      <Box sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={stage} onChange={handleChange}>
          {TWO_D_STAGES.map((s) => (
            <Tab key={s.key} value={s.key} label={s.label} sx={{ textTransform: "none" }} />
          ))}
        </Tabs>
      </Box>
      {/* key forces a clean board remount per stage (column state is per-type) */}
      <WorkStagesKanban key={stage} type={stage} />
    </>
  );
}

export default function Page() {
  const { user } = useAuth();
  if (!user?.profile) return null;
  if (user.profile === "DESIGNER_2D") {
    return <TwoDBoard />;
  }
  return <WorkStagesKanban type={PROJECT_TYPES_ENUM.ThreeD.DESIGNER} />;
}
