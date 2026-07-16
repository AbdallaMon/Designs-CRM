"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import { PROJECT_TYPES_ENUM } from "@/app/helpers/constants";
import WorkStagesKanban from "@/features/work-stages/WorkStageKanban";
import MyDayStrip from "@/features/my-day/MyDayStrip.jsx";

export default function Page() {
  const { user } = useAuth();
  if (!user?.role) return null;

  if (user.role === "TWO_D_DESIGNER") {
    return <MyDayStrip />;
  }
  return (
    <>
      <MyDayStrip />
      <WorkStagesKanban type={PROJECT_TYPES_ENUM.ThreeD.DESIGNER} />
    </>
  );
}
