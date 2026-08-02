"use client";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import ProjectPage from "@/features/work-stages/projects/ProjectPage";

export default function Page() {
  const { user } = useAuth();
  const params = useParams();
  if (!user?.profile) return null;
  const { id } = params;

  if (user.profile === "DESIGNER_3D" || user.profile === "DESIGNER_2D") {
    return <ProjectPage id={id} isStaff={true} />;
  }
  return <ProjectPage id={id} />;
}
