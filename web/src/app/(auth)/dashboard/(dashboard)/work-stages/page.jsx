"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { PROJECT_TYPES_ENUM } from "@/app/helpers/constants";
import WorkStagesKanban from "@/features/work-stages/WorkStageKanban";
// ⏸️ My Day disabled 2026-07-16 (user request) — un-comment with the My Day page + nav row.
// import MyDayStrip from "@/features/my-day/MyDayStrip.jsx";

export default function Page() {
  const { user } = useAuth();
  if (!user?.role) return null;

  // ⏸️ Was: TWO_D_DESIGNER got the My Day strip only; restore with the My Day screen.
  if (user.role === "TWO_D_DESIGNER") {
    return "";
  }
  // ⏸️ Disabled 2026-07-16: return (<><MyDayStrip /><WorkStagesKanban … /></>);
  return <WorkStagesKanban type={PROJECT_TYPES_ENUM.ThreeD.DESIGNER} />;
}
