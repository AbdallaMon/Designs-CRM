"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import StaffLeadsKanbanBoard from "@/app/UiComponents/DataViewer/Kanban/staff/StaffLeadsKanbanBoard";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.role) return null;
  const role = user.role;

  if (role === "STAFF" && !user.isSuperSales) {
    return <StaffLeadsKanbanBoard />;
  }
  return <StaffLeadsKanbanBoard staffId={sp.get("staffId") ?? undefined} />;
}
