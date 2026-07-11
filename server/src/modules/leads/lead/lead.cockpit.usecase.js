// leads/lead — Sales Deal Cockpit usecase (kept in its own focused file; the lead
// usecase is already split across lead.usecase / lead.assign-status / lead.sub-resources).
//
// Orchestration only — NO Prisma here. Fetches the narrow cockpit bundle from the repo,
// runs the PURE `computeCockpit(bundle, now)` rules engine, and shapes the DTO (adding
// `capabilities`). Object scope (IDOR) is enforced upstream by the route's
// `requireSpecialChecker(checkIfUserCanAccessLead)`; this only runs after that passes.
import { AppError } from "../../../shared/errors/AppError.js";
import { leadsMessagesCodes as C } from "@dms/shared";
import { leadRepository } from "./lead.repo.js";
import { computeCockpit } from "./lead.cockpit.js";
import { toCockpitDto } from "./lead.dto.js";

// The Prisma relation is `versaModel` (schema name); the pure engine expects
// `versaModels`. Normalize here so `computeCockpit` stays framework-agnostic.
function normalizeBundle(bundle) {
  return { ...bundle, versaModels: bundle.versaModel ?? [] };
}

export class LeadCockpitUsecase {
  /** @param {import("./lead.repo.js").LeadRepository} repository */
  constructor(repository) {
    this.repo = repository;
  }

  /**
   * Build the cockpit payload for one lead.
   * @param {{ clientLeadId: number|string, authUser: object, now?: Date }} args
   *   `now` is injectable so the pure engine (and tests) stay deterministic.
   * @returns {Promise<{ health: object, actions: Array, capabilities: object }>}
   */
  async getLeadCockpit({ clientLeadId, authUser, now = new Date() }) {
    const bundle = await this.repo.findCockpitBundle({ clientLeadId: Number(clientLeadId) });
    if (!bundle) throw new AppError(C.LEAD_NOT_FOUND, 404);
    const computed = computeCockpit(normalizeBundle(bundle), now, { profileKey: authUser?.currentProfileKey });
    return toCockpitDto(computed, bundle, authUser);
  }
}

export const leadCockpitUsecase = new LeadCockpitUsecase(leadRepository);
