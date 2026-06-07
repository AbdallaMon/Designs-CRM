// questions usecase — orchestration ONLY (Prisma lives in the repo). The SPIN
// session-questions/answers + VERSA objection-handling logic is ported from the legacy
// service; the v2 module ADDS the object-scope check the legacy routes were MISSING:
// every LEAD-SCOPED action resolves its parent clientLead and runs the leads-module
// object-scope checker (checkIfUserCanAccessLead) before touching the data — the IDOR
// fix. The acting user is always derived from authUser (req.auth), never from the body.
//
// SCOPE MODEL:
//   - CONFIG_VIEW (question types) is GLOBAL config — no per-owner scope; the code is
//     the gate. (Seeding is idempotent and runs here, matching legacy.)
//   - session-questions / custom-question / VERSA reads+writes are LEAD-SCOPED by the
//     clientLeadId in the path.
//   - answer / answer/bulk are LEAD-SCOPED indirectly: the sessionQuestionId resolves
//     to a parent clientLead which is then scope-checked.
//   - VERSA step update is LEAD-SCOPED indirectly: the stepId resolves to its VersaModel
//     → clientLead which is then scope-checked.
import { AppError } from "../../shared/errors/AppError.js";
import { questionsMessagesCodes as C } from "@dms/shared";
import { leadUsecase } from "../leads/lead/lead.usecase.js";
import { questionsRepository } from "./questions.repository.js";

export class QuestionsUsecase {
  constructor(repository, leads = leadUsecase) {
    this.repo = repository;
    this.leads = leads;
  }

  // Resolve a lead and assert the caller may READ it (VIEW scope). Reuses the
  // leads-module checker (throws LEAD_ACCESS_DENIED on denial / non-existence). We
  // surface a questions-domain code on a missing parent so the envelope is consistent.
  // READ scope intentionally INCLUDES the claimable unassigned-NEW pool — used by
  // genuine read entrypoints (and by getQuestionTypes, see its note).
  async assertLeadAccess({ clientLeadId, authUser }) {
    if (clientLeadId == null) {
      throw new AppError(C.QUESTION_NOT_FOUND, 404);
    }
    // Delegates to the keystone IDOR checker; throws AppError(LEAD_ACCESS_DENIED, 403)
    // when the lead is outside the caller's scope or does not exist.
    return this.leads.checkIfUserCanAccessLead({ id: clientLeadId, authUser });
  }

  // Resolve a lead and assert the caller may WRITE it (MUTATE scope — owned-only,
  // stricter than read). Used by every lead-scoped WRITE entrypoint so a scoped user
  // cannot mutate a lead they can only VIEW (the claimable unassigned-NEW pool) without
  // first claiming it. Throws AppError(LEAD_MUTATE_DENIED, 403) on denial / non-existence.
  async assertLeadMutate({ clientLeadId, authUser }) {
    if (clientLeadId == null) {
      throw new AppError(C.QUESTION_NOT_FOUND, 404);
    }
    return this.leads.checkIfUserCanMutateLead({ id: clientLeadId, authUser });
  }

  // ── GET /question-types/:clientLeadId ────────────────────────────────────────────
  // Legacy: ensure default categories+questions (global), ensure session questions for
  // this lead (lead-scoped — creates rows), then return the global question types.
  //
  // SCOPE: intentionally kept on access-scope (READ), NOT mutate-scope. This is a VIEW
  // entrypoint that idempotently SEEDS session questions as a side-effect
  // (ensureSessionQuestions). Keeping it on read-scope preserves the ability to view
  // question types for a claimable unassigned-NEW lead (the claim-decision UI) — the
  // seed is an idempotent side-effect that is deliberately allowed under view-scope, not
  // a user-driven write of lead content. (Genuine content writes — answers, custom
  // questions, VERSA — use assertLeadMutate.)
  async getQuestionTypes({ clientLeadId, authUser }) {
    await this.assertLeadAccess({ clientLeadId, authUser });
    await this.repo.ensureDefaultCategoriesAndQuestions();
    await this.repo.ensureSessionQuestions({ clientLeadId, userId: authUser.id });
    return this.repo.getQuestionsTypes();
  }

  // ── GET /session-questions/:clientLeadId ─────────────────────────────────────────
  async getSessionQuestions({ clientLeadId, questionTypeId, authUser }) {
    await this.assertLeadAccess({ clientLeadId, authUser });
    return this.repo.getSessionQuestionsByClientLeadId({ clientLeadId, questionTypeId });
  }

  // ── POST /:sessionQuestionId/answer ──────────────────────────────────────────────
  async submitAnswer({ sessionQuestionId, response, authUser }) {
    const clientLeadId = await this.repo.findLeadIdBySessionQuestion({ sessionQuestionId });
    if (clientLeadId == null) throw new AppError(C.QUESTION_NOT_FOUND, 404);
    // WRITE path → MUTATE scope (owned-only); a claimable NEW lead is not writable.
    await this.assertLeadMutate({ clientLeadId, authUser });
    return this.repo.upsertAnswer({ sessionQuestionId, response, userId: authUser.id });
  }

  // ── POST /answer/bulk ────────────────────────────────────────────────────────────
  // Each answer's sessionQuestionId is independently resolved to its parent lead and
  // scope-checked (legacy did NONE of this). The userId comes from req.auth only.
  // WRITE path → MUTATE scope is asserted for EVERY item's parent lead.
  async submitBulkAnswers({ answers, authUser }) {
    const results = [];
    for (const { sessionQuestionId, response } of answers) {
      const clientLeadId = await this.repo.findLeadIdBySessionQuestion({ sessionQuestionId });
      if (clientLeadId == null) throw new AppError(C.QUESTION_NOT_FOUND, 404);
      await this.assertLeadMutate({ clientLeadId, authUser });
      await this.repo.upsertAnswer({ sessionQuestionId, response, userId: authUser.id });
      results.push({ sessionQuestionId, response });
    }
    return results;
  }

  // ── POST /lead/:clientLeadId/custom-question ─────────────────────────────────────
  async createCustomQuestion({ clientLeadId, questionTypeId, title, authUser }) {
    // WRITE path → MUTATE scope (owned-only).
    await this.assertLeadMutate({ clientLeadId, authUser });
    return this.repo.createCustomQuestion({
      clientLeadId,
      questionTypeId,
      title,
      userId: authUser.id,
    });
  }

  // ── GET /versa/:clientLeadId ─────────────────────────────────────────────────────
  async getVersaCategories({ clientLeadId, authUser }) {
    await this.assertLeadAccess({ clientLeadId, authUser });
    return this.repo.getCategoriesWithVersaStatus({ clientLeadId });
  }

  // ── GET /versa/:clientLeadId/category/:categoryId ────────────────────────────────
  async getVersaByCategory({ clientLeadId, categoryId, authUser }) {
    await this.assertLeadAccess({ clientLeadId, authUser });
    return this.repo.getVersaByCategory({ clientLeadId, categoryId });
  }

  // ── POST /versa/:clientLeadId/category/:categoryId ───────────────────────────────
  // Legacy spread the whole body into createVersaModel; we whitelist categoryId from
  // the path (authoritative) and derive userId from req.auth.
  async createVersa({ clientLeadId, categoryId, authUser }) {
    // WRITE path → MUTATE scope (owned-only).
    await this.assertLeadMutate({ clientLeadId, authUser });
    return this.repo.createVersaModel({ clientLeadId, categoryId, userId: authUser.id });
  }

  // ── PUT /versa/steps/:stepId ─────────────────────────────────────────────────────
  // The step resolves to its VersaModel → parent lead; scope-check before updating.
  async updateVersaStep({ stepId, fields, authUser }) {
    const exists = await this.repo.versaStepExists({ stepId });
    if (!exists) throw new AppError(C.VERSA_STEP_NOT_FOUND, 404);
    const clientLeadId = await this.repo.findLeadIdByVersaStep({ stepId });
    // A step always belongs to a VersaModel (created together); if orphaned, deny.
    if (clientLeadId == null) throw new AppError(C.QUESTION_ACCESS_DENIED, 403);
    // WRITE path → MUTATE scope (owned-only) on the resolved parent lead.
    await this.assertLeadMutate({ clientLeadId, authUser });
    return this.repo.updateVersaStep({ stepId, ...fields });
  }
}

export const questionsUsecase = new QuestionsUsecase(questionsRepository);
