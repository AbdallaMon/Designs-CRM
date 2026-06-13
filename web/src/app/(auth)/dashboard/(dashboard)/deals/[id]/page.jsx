"use client";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PreviewDialog from "@/app/UiComponents/DataViewer/leads/PreviewLeadDialog.jsx";
import PreviewWorkStage from "@/app/UiComponents/DataViewer/work-stages/PreviewWorkStage";

export default function Page() {
  const { user } = useAuth();
  const params = useParams();
  if (!user?.role) return null;
  const role = user.role;
  const { id } = params;

  if (role === "THREE_D_DESIGNER") {
    return <PreviewWorkStage type="three-d" open={true} page={true} id={id} />;
  }
  if (role === "TWO_D_DESIGNER") {
    return <PreviewWorkStage type="two-d" open={true} page={true} id={id} />;
  }
  if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPER_SALES") {
    return <PreviewDialog open={true} page={true} id={id} admin={true} />;
  }
  return <PreviewDialog open={true} page={true} id={id} />;
}
