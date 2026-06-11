// Projects feature barrel.
export { ProjectsPage, default as ProjectsPageDefault } from "./pages/ProjectsPage.jsx";
export { LeadProjects } from "./components/LeadProjects.jsx";
export { ProjectDetails } from "./components/ProjectDetails.jsx";
export { AssignDesignerModal } from "./components/AssignDesignerModal.jsx";
export { default as DeliverySchedulesPanel } from "./components/DeliverySchedulesPanel.jsx";
export { ProjectTasksPanel } from "./components/ProjectTasksPanel.jsx";
export { TaskActions } from "./components/TaskActions.jsx";
export { CreateTaskModal } from "./components/CreateTaskModal.jsx";
export { UpdatesList } from "./components/updates/UpdatesList.jsx";
export { UpdateCard } from "./components/updates/UpdateCard.jsx";
export { CreateUpdateModal } from "./components/updates/CreateUpdateModal.jsx";
export { projectsService, pickProjectFields, pickTaskFields } from "./projects.service.js";
export { runProjectMutation } from "./projects.mutations.js";
