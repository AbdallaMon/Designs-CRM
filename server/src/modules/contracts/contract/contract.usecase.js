// contracts/contract usecase — business logic / orchestration ONLY. Prisma NEVER appears
// here: scope-resolution lookups go through the repo, and all the heavy contract CRUD +
// PDF logic stays in the FROZEN legacy service, invoked via static imports (never
// duplicated). Errors are thrown as AppError(code, statusCode); the envelope serializes.
//
// OBJECT SCOPE — the keystone IDOR fix the legacy `/shared/contracts/*` routes were
// MISSING (no object scope at all). Contracts are LEAD-SCOPED. Two resolution paths:
//   - `:leadId` routes  → check the lead DIRECTLY (access for reads, mutate for writes).
//   - `:contractId` / `:paymentId` / `:stageId` / `:drawId` / `:itemId` routes → resolve
//     the row's parent clientLeadId in the repo FIRST, then run the lead checker before
//     touching the legacy service. A forged/missing id → CONTRACT_NOT_FOUND (404).
// The acting user is derived from authUser (req.auth), never the body.
//
// 🔒 PDF GENERATION IS LOGIC-FROZEN: the cancel action calls the legacy
// `markContractAsCancelled` (which itself calls the frozen `buildAndUploadContractPdf`);
// we ONLY wrap it — we never touch the PDF logic, fonts, or output.
//
// PAYMENTS-LIST EXCEPTION: getGroupedPayments is a GLOBAL cross-lead grouped list
// whose per-role scoping lives INSIDE the frozen service (admin-tier see all; others
// scoped to their own clientLead.userId). It is NOT lead-scoped per-record — the
// permission code is the gate and the service supplies the scope. We pass req.auth as the
// `user` exactly as legacy passed getCurrentUser(req).
import { AppError } from "../../../shared/errors/AppError.js";
import { CONTRACT_PAYMENT_STATUSES, contractsMessagesCodes, AUDIT_MODULES, AUDIT_ACTIONS } from "@dms/shared";
import { recordAction } from "../../../infra/audit/record-action.js";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";
import { contractRepository } from "./contract.repo.js";
// The not-yet-migrated, FROZEN contract service (behavior-preserving — wrapped, never edited).
import {
  getLeadContractList,
  createContract,
  getContractDetailsById,
  updateContractBasics,
  generatePdfSessionToken,
  createContractStage,
  updateContractStage,
  overrideContractStageStatus,
  deleteContractStage,
  getContractPaymentsGroupedService,
  updateContractPaymentStatus,
  updateContractPaymentAmounts,
  createNewContractPayment,
  updateContractPayment,
  deleteContractPayment,
  createContractDrawing,
  updateContractDrwaing,
  deleteContractDrawing,
  createContractSpecialItem,
  updateContractSpecialItem,
  deleteContractSpecialItem,
} from "./contract.workflow.repo.js";
import { markContractAsCancelled } from "../services/contract-pdf.service.js";
import { siteUtilityUsecase } from "../../site-utility/site-utility.usecase.js";

class ContractUsecase {
  // ── scope helpers ─────────────────────────────────────────────────────────────────
  // Direct lead scope (the `:leadId` routes). READ → access, WRITE → mutate.
  assertLeadAccess({ clientLeadId, authUser }) {
    return leadUsecase.checkIfUserCanAccessLead({ id: clientLeadId, authUser });
  }
  assertLeadMutate({ clientLeadId, authUser }) {
    return leadUsecase.checkIfUserCanMutateLead({ id: clientLeadId, authUser });
  }

  // Resolve a `:contractId` → its parent clientLeadId, then run the lead checker. A
  // missing/forged contract → CONTRACT_NOT_FOUND (so a money/PDF mutation never runs
  // against a non-existent contract). `mode` selects access (read) vs mutate (write).
  async #scopeByContract({ contractId, authUser, mode }) {
    const row = await contractRepository.getContractClientLeadId({ contractId });
    if (!row || row.clientLeadId == null) throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    if (mode === "mutate") await this.assertLeadMutate({ clientLeadId: row.clientLeadId, authUser });
    else await this.assertLeadAccess({ clientLeadId: row.clientLeadId, authUser });
    return row;
  }

  // Generic child-id resolver: `resolver` returns { clientLeadId } for the child id.
  async #scopeByResolved({ resolver, authUser, mode }) {
    const row = await resolver();
    if (!row || row.clientLeadId == null) throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    if (mode === "mutate") await this.assertLeadMutate({ clientLeadId: row.clientLeadId, authUser });
    else await this.assertLeadAccess({ clientLeadId: row.clientLeadId, authUser });
    return row;
  }

  #assertChildContract({ row, contractId }) {
    if (contractId != null && Number(row?.contractId) !== Number(contractId)) {
      throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
    }
    return row;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  CONTRACT-LEVEL
  // ════════════════════════════════════════════════════════════════════════════

  // Contract-create lookup: the route supplies the coarse CONTRACT.CREATE gate;
  // this usecase adds the same lead mutate-scope required by createContract itself.
  async listPaymentConditionsForLead({ leadId, authUser }) {
    await this.assertLeadMutate({ clientLeadId: leadId, authUser });
    return siteUtilityUsecase.listPaymentConditions({ authUser });
  }

  // GET /client-lead/:leadId — lead-scoped list (READ scope on the lead directly).
  async listLeadContracts({ leadId, authUser }) {
    await this.assertLeadAccess({ clientLeadId: leadId, authUser });
    return getLeadContractList({ leadId });
  }

  // POST / — create a contract for a lead (WRITE scope on the target lead, from the body).
  async createContract({ payload, authUser, auditCtx }) {
    await this.assertLeadMutate({ clientLeadId: payload.clientLeadId, authUser });
    if (payload.oldContractId != null && payload.markOldAsCancelled) {
      const oldContract = await this.#scopeByContract({
        contractId: payload.oldContractId,
        authUser,
        mode: "mutate",
      });
      if (Number(oldContract.clientLeadId) !== Number(payload.clientLeadId)) {
        throw new AppError({ code: contractsMessagesCodes.CONTRACT_NOT_FOUND, statusCode: 404 });
      }
    }
    const contract = await createContract({ payload });
    // Semantic audit: a contract was created for the lead.
    await recordAction(auditCtx, {
      module: AUDIT_MODULES.CONTRACT,
      action: AUDIT_ACTIONS.CONTRACT_CREATED,
      entityType: "Contract",
      entityId: contract?.id ?? null,
      clientLeadId: contract?.clientLeadId ?? Number(payload.clientLeadId),
      summary: `Contract #${contract?.id ?? "?"} created for lead #${payload.clientLeadId}`,
      detail: {
        contractId: contract?.id ?? null,
        title: contract?.title ?? payload.title ?? null,
        totalAmount: contract?.totalAmount ?? null,
      },
    });
    return contract;
  }

  // GET /:contractId — lead-scoped detail (READ scope via contract → lead).
  async getContractById({ contractId, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "access" });
    return getContractDetailsById({ contractId });
  }

  // PUT /:contractId/basics — plain field edit (WRITE scope via contract → lead).
  async updateContractBasics({ contractId, payload, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return updateContractBasics({ contractId, ...payload });
  }

  // POST /:contractId/actions/cancel — workflow action (legacy PATCH /:contractId/cancel).
  // 🔒 markContractAsCancelled builds a cancelled PDF via the frozen service. WRITE scope.
  async cancelContract({ contractId, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return markContractAsCancelled({ contractId: Number(contractId) });
  }

  // POST /:contractId/actions/generate-pdf-token — workflow action (legacy PATCH /:contractId).
  // Mints the ar/en signing tokens. WRITE scope.
  async generatePdfToken({ contractId, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return generatePdfSessionToken({ contractId: Number(contractId) });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PAYMENTS GROUPED LIST (global, role-scoped INSIDE the frozen service)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /payments/all. NOT per-record lead-scoped: the workflow repository applies profile scope
  // scope (admin-tier see all; others scoped to clientLead.userId === user.id). We pass
  // req.auth as `user`.
  async getGroupedPayments({ page, limit, status, authUser }) {
    return getContractPaymentsGroupedService({ page, limit, status, user: authUser });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  STAGES (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createStage({ contractId, stage, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return createContractStage({ contractId: Number(contractId), stage });
  }

  async updateStage({ contractId, stageId, newStage, authUser }) {
    // Scope by the stage's parent contract → lead, AND verify the stage belongs to the
    // path contract (path ids authoritative). The stage resolver gives us contractId.
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getStageClientLeadId({ stageId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return updateContractStage({ stageId, newStage });
  }

  async overrideStageStatus({ contractId, stageId, status, reason, authUser, auditCtx }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getStageClientLeadId({ stageId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });

    const result = await overrideContractStageStatus({
      contractId: Number(contractId),
      stageId: Number(stageId),
      status,
    });
    await recordAction(auditCtx, {
      module: AUDIT_MODULES.CONTRACT,
      action: AUDIT_ACTIONS.CONTRACT_STAGE_STATUS_OVERRIDDEN,
      entityType: "ContractStage",
      entityId: Number(stageId),
      clientLeadId: row.clientLeadId,
      summary: `Contract stage #${stageId} overridden from ${result.previousStatus} to ${status}`,
      detail: {
        contractId: Number(contractId),
        stageId: Number(stageId),
        stageLevel: result.stage?.title ?? null,
        previousStatus: result.previousStatus,
        requestedStatus: status,
        resultingStatus: result.stage?.stageStatus ?? null,
        activeStageId: result.activeStage?.id ?? null,
        activeStageLevel: result.activeStage?.title ?? null,
        reason,
      },
    });
    return result;
  }

  async deleteStage({ contractId, stageId, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getStageClientLeadId({ stageId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return deleteContractStage({ stageId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PAYMENTS (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createPayment({ contractId, payment, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return createNewContractPayment({ contractId, payment });
  }

  async updatePayment({ contractId, paymentId, newPayment, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return updateContractPayment({ paymentId, newPayment });
  }

  async deletePayment({ contractId, paymentId, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return deleteContractPayment({ paymentId });
  }

  async updatePaymentStatus({ contractId, paymentId, status, authUser, auditCtx }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    const result = await updateContractPaymentStatus({ paymentId, status });
    // Semantic audit: only a transition to a PAID state (RECEIVED / TRANSFERRED — the two
    // "money collected" statuses the payment-status control allows) is a "payment paid".
    if (status === CONTRACT_PAYMENT_STATUSES.RECEIVED || status === CONTRACT_PAYMENT_STATUSES.TRANSFERRED) {
      await recordAction(auditCtx, {
        module: AUDIT_MODULES.CONTRACT,
        action: AUDIT_ACTIONS.CONTRACT_PAYMENT_PAID,
        entityType: "ContractPayment",
        entityId: Number(paymentId),
        clientLeadId: row?.clientLeadId ?? null,
        summary: `Contract payment #${paymentId} marked ${status}`,
        detail: { paymentId: Number(paymentId), status },
      });
    }
    return result;
  }

  async updatePaymentAmounts({ contractId, paymentId, amountLost, amountReceived, status, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return updateContractPaymentAmounts({ paymentId, amountLost, amountReceived, status });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DRAWINGS (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createDrawing({ contractId, drawing, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return createContractDrawing({ contractId, drawing });
  }

  async updateDrawing({ contractId, drawId, newDrawing, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getDrawingClientLeadId({ drawId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return updateContractDrwaing({ drawId, newDrawing });
  }

  async deleteDrawing({ contractId, drawId, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getDrawingClientLeadId({ drawId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return deleteContractDrawing({ drawId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SPECIAL ITEMS (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createSpecialItem({ contractId, item, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return createContractSpecialItem({ contractId, item });
  }

  async updateSpecialItem({ contractId, specialItemId, newSpecialItem, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getSpecialItemClientLeadId({ specialItemId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return updateContractSpecialItem({ specialItemId, newSpecialItem });
  }

  async deleteSpecialItem({ contractId, specialItemId, authUser }) {
    const row = await this.#scopeByResolved({
      resolver: () => contractRepository.getSpecialItemClientLeadId({ specialItemId }),
      authUser,
      mode: "mutate",
    });
    this.#assertChildContract({ row, contractId });
    return deleteContractSpecialItem({ specialItemId });
  }
}

export const contractUsecase = new ContractUsecase();
export { ContractUsecase };
