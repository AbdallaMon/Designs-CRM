"use client";
import { PROFILES } from "@dms/shared";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import PreviewWorkStage from "@/features/work-stages/PreviewWorkStage";

export default function Page() {
  const { user } = useAuth();
  const params = useParams();
  if (!user?.profile) return null;
  const { id } = params;

  if (user.profile === PROFILES.DESIGNER_2D) {
    return <PreviewWorkStage type="two-d" open={true} page={true} id={id} />;
  }
  return <PreviewWorkStage type="three-d" open={true} page={true} id={id} />;
}
