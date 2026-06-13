"use client";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PreviewWorkStage from "@/app/UiComponents/DataViewer/work-stages/PreviewWorkStage";

export default function Page() {
  const { user } = useAuth();
  const params = useParams();
  if (!user?.role) return null;
  const { id } = params;

  if (user.role === "TWO_D_DESIGNER") {
    return <PreviewWorkStage type="two-d" open={true} page={true} id={id} />;
  }
  return <PreviewWorkStage type="three-d" open={true} page={true} id={id} />;
}
