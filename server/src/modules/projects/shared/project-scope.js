// projects/shared — the single canonical project-scope entry point for the whole
// PROJECTS domain. The task / update / delivery usecases import THIS so there is
// exactly ONE project access+mutate checker (the IDOR keystone) — no divergent copies.
// It simply re-exports the project usecase, whose checkIfUserCanAccessProject /
// checkIfUserCanMutateProject (+ the clientLead/parent-resolution helpers) are the
// shared scope logic.
export { projectUsecase, ProjectUsecase, LOCKED_FROM_STATUSES_FOR_NON_ADMIN } from "../project/project.usecase.js";
