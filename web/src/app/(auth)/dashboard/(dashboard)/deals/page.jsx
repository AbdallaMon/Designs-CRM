"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import StaffLeadsKanbanBoard from "@/features/Kanban/staff/StaffLeadsKanbanBoard";
import MyDayStrip from "@/features/my-day/MyDayStrip.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.role) return null;
  const role = user.role;

  const board =
    role === "STAFF" && user.profile !== "SUPER_SALES" ? (
      <StaffLeadsKanbanBoard />
    ) : (
      <StaffLeadsKanbanBoard staffId={sp.get("staffId") ?? undefined} />
    );

  return (
    <>
      <MyDayStrip />
      {board}
    </>
  );
}
