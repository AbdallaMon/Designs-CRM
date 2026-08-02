"use client";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PreviewDialog from "@/features/leads/PreviewLeadDialog.jsx";
import PreviewWorkStage from "@/features/work-stages/PreviewWorkStage";

export default function Page() {
  const { user } = useAuth();
  const params = useParams();
  if (!user?.profile) return null;
  const { id } = params;

  if (user.profile === "DESIGNER_3D") {
    return <PreviewWorkStage type="three-d" open={true} page={true} id={id} />;
  }
  if (user.profile === "DESIGNER_2D") {
    return <PreviewWorkStage type="two-d" open={true} page={true} id={id} />;
  }
  if (["ADMIN", "SUPER_ADMIN", "SUPER_SALES"].includes(user.profile)) {
    return <PreviewDialog open={true} page={true} id={id} admin={true} />;
  }
  return <PreviewDialog open={true} page={true} id={id} />;
}
