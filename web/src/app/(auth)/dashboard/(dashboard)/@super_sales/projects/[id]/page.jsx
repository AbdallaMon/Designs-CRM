import ProjectPage from "@/app/UiComponents/DataViewer/work-stages/projects/ProjectPage";

export default function Page({ params }) {
  const { id } = params;
  return <ProjectPage id={id} />;
}
