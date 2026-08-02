"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import StaffLeadsKanbanBoard from "@/features/Kanban/staff/StaffLeadsKanbanBoard";
// ⏸️ My Day disabled 2026-07-16 (user request) — un-comment with the My Day page + nav row.
// import MyDayStrip from "@/features/my-day/MyDayStrip.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.profile) return null;
  const board =
    ["NORMAL_SALES", "PRIMARY_SALES"].includes(user.profile) ? (
      <StaffLeadsKanbanBoard />
    ) : (
      <StaffLeadsKanbanBoard staffId={sp.get("staffId") ?? undefined} />
    );

  // ⏸️ Disabled 2026-07-16 with the My Day screen: return (<><MyDayStrip />{board}</>);
  return board;
}
