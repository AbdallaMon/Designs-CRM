// admin-residual/model-archive usecase — the generic archive-by-model (legacy
// PATCH `/admin/model/archived/:id?model=<x>`). Legacy did an OPEN
// `prisma[model].update({ data: { isArchived } })` with ZERO allow-list — any client
// `model` query value could flip `isArchived` on any table (the projects broad-delete
// lesson). v2 RESOLVES the client-supplied model name against
// ADMIN_ARCHIVE_MODEL_ALLOWLIST (case-insensitive → the real camelCase Prisma delegate)
// and REJECTS anything else, then hands the safe delegate name to the FROZEN
// `toggleArchiveAModel` service (invoked via a lazy adapter — no Prisma here, no
// duplication). The whitelisted models are GLOBAL image-session reference data
// (style/colorPattern/material/space/designImage — all have an `isArchived` column),
// so the ADMIN code is the gate; there is no per-lead owner to scope.
import { AppError } from "../../../shared/errors/AppError.js";
import { ADMIN_ARCHIVE_MODEL_ALLOWLIST, adminResidualMessagesCodes } from "@dms/shared";
import { modelArchiveRepository } from "./model-archive.repo.js";

class ModelArchiveUsecase {
  // Resolve + validate the client-supplied model name, then archive/unarchive the row.
  archiveModel({ model, id, isArchived }) {
    const key = String(model ?? "").toLowerCase();
    const delegate = ADMIN_ARCHIVE_MODEL_ALLOWLIST[key];
    if (!delegate) {
      throw new AppError({ code: adminResidualMessagesCodes.MODEL_NOT_ALLOWED, statusCode: 422 });
    }
    return modelArchiveRepository.toggleArchiveAModel({ model: delegate, id: Number(id), isArchived });
  }
}

export const modelArchiveUsecase = new ModelArchiveUsecase();
export { ModelArchiveUsecase };
