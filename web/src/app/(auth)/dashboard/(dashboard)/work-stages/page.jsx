"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { PROJECT_TYPES_ENUM } from "@/app/helpers/constants";
import WorkStagesKanban from "@/app/UiComponents/DataViewer/work-stages/WorkStageKanban";

export default function Page() {
  const { user } = useAuth();
  if (!user?.role) return null;

  if (user.role === "TWO_D_DESIGNER") {
    return "";
  }
  return <WorkStagesKanban type={PROJECT_TYPES_ENUM.ThreeD.DESIGNER} />;
}
