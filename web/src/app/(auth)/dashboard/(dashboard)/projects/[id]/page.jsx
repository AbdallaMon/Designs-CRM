"use client";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import ProjectPage from "@/app/UiComponents/DataViewer/work-stages/projects/ProjectPage";

export default function Page() {
  const { user } = useAuth();
  const params = useParams();
  if (!user?.role) return null;
  const { id } = params;

  if (user.role === "THREE_D_DESIGNER" || user.role === "TWO_D_DESIGNER") {
    return <ProjectPage id={id} isStaff={true} />;
  }
  return <ProjectPage id={id} />;
}
