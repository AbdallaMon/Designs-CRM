// contracts/contract usecase — business logic / orchestration ONLY. Prisma NEVER appears
// here: scope-resolution lookups go through the repo, and all the heavy contract CRUD +
// PDF logic stays in the FROZEN legacy service, invoked via lazy adapters (never
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
// we ONLY wrap it via a lazy adapter — we never touch the PDF logic, fonts, or output.
//
// PAYMENTS-LIST EXCEPTION: getContractPaymentsGrouped is a GLOBAL cross-lead grouped list
// whose per-role scoping lives INSIDE the frozen service (admin-tier see all; others
// scoped to their own clientLead.userId). It is NOT lead-scoped per-record — the
// permission code is the gate and the service supplies the scope. We pass req.auth as the
// `user` exactly as legacy passed getCurrentUser(req).
import { AppError } from "../../../shared/errors/AppError.js";
import { contractsMessagesCodes as C } from "@dms/shared";
import { leadUsecase } from "../../leads/lead/lead.usecase.js";
import { contractRepository } from "./contract.repository.js";

// Lazy adapters to the not-yet-migrated, FROZEN contract service (behavior-preserving).
const legacyDefaults = {
  getLeadContractList: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.getLeadContractList(a)),
  createContract: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.createContract(a)),
  getContractDetailsById: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.getContractDetailsById(a)),
  updateContractBasics: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.updateContractBasics(a)),
  markContractAsCancelled: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.markContractAsCancelled(a)),
  generatePdfSessionToken: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.generatePdfSessionToken(a)),
  createContractStage: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.createContractStage(a)),
  updateContractStage: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.updateContractStage(a)),
  deleteContractStage: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.deleteContractStage(a)),
  getContractPaymentsGroupedService: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) =>
      m.getContractPaymentsGroupedService(a),
    ),
  updateContractPaymentStatus: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.updateContractPaymentStatus(a)),
  updateContractPaymentAmounts: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.updateContractPaymentAmounts(a)),
  createNewContractPayment: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.createNewContractPayment(a)),
  updateContractPayment: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.updateContractPayment(a)),
  deleteContractPayment: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.deleteContractPayment(a)),
  createContractDrawing: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.createContractDrawing(a)),
  updateContractDrwaing: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.updateContractDrwaing(a)),
  deleteContractDrawing: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.deleteContractDrawing(a)),
  createContractSpecialItem: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.createContractSpecialItem(a)),
  updateContractSpecialItem: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.updateContractSpecialItem(a)),
  deleteContractSpecialItem: (a) =>
    import("../../../../services/main/contract/contractServices.js").then((m) => m.deleteContractSpecialItem(a)),
};

export class ContractUsecase {
  constructor(repository = contractRepository, leads = leadUsecase, legacy = {}) {
    this.repo = repository;
    this.leads = leads;
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  // ── scope helpers ─────────────────────────────────────────────────────────────────
  // Direct lead scope (the `:leadId` routes). READ → access, WRITE → mutate.
  assertLeadAccess({ clientLeadId, authUser }) {
    return this.leads.checkIfUserCanAccessLead({ id: clientLeadId, authUser });
  }
  assertLeadMutate({ clientLeadId, authUser }) {
    return this.leads.checkIfUserCanMutateLead({ id: clientLeadId, authUser });
  }

  // Resolve a `:contractId` → its parent clientLeadId, then run the lead checker. A
  // missing/forged contract → CONTRACT_NOT_FOUND (so a money/PDF mutation never runs
  // against a non-existent contract). `mode` selects access (read) vs mutate (write).
  async #scopeByContract({ contractId, authUser, mode }) {
    const row = await this.repo.getContractClientLeadId({ contractId });
    if (!row || row.clientLeadId == null) throw new AppError(C.CONTRACT_NOT_FOUND, 404);
    if (mode === "mutate") await this.assertLeadMutate({ clientLeadId: row.clientLeadId, authUser });
    else await this.assertLeadAccess({ clientLeadId: row.clientLeadId, authUser });
    return row;
  }

  // Generic child-id resolver: `resolver` returns { clientLeadId } for the child id.
  async #scopeByResolved({ resolver, authUser, mode }) {
    const row = await resolver();
    if (!row || row.clientLeadId == null) throw new AppError(C.CONTRACT_NOT_FOUND, 404);
    if (mode === "mutate") await this.assertLeadMutate({ clientLeadId: row.clientLeadId, authUser });
    else await this.assertLeadAccess({ clientLeadId: row.clientLeadId, authUser });
    return row;
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  CONTRACT-LEVEL
  // ════════════════════════════════════════════════════════════════════════════

  // GET /client-lead/:leadId — lead-scoped list (READ scope on the lead directly).
  async listForLead({ leadId, authUser }) {
    await this.assertLeadAccess({ clientLeadId: leadId, authUser });
    return this.legacy.getLeadContractList({ leadId });
  }

  // POST / — create a contract for a lead (WRITE scope on the target lead, from the body).
  async create({ payload, authUser }) {
    await this.assertLeadMutate({ clientLeadId: payload.clientLeadId, authUser });
    return this.legacy.createContract({ payload });
  }

  // GET /:contractId — lead-scoped detail (READ scope via contract → lead).
  async getById({ contractId, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "access" });
    return this.legacy.getContractDetailsById({ contractId });
  }

  // PUT /:contractId/basics — plain field edit (WRITE scope via contract → lead).
  async updateBasics({ contractId, payload, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return this.legacy.updateContractBasics({ contractId, ...payload });
  }

  // POST /:contractId/actions/cancel — workflow action (legacy PATCH /:contractId/cancel).
  // 🔒 markContractAsCancelled builds a cancelled PDF via the frozen service. WRITE scope.
  async cancel({ contractId, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return this.legacy.markContractAsCancelled({ contractId: Number(contractId) });
  }

  // POST /:contractId/actions/generate-pdf-token — workflow action (legacy PATCH /:contractId).
  // Mints the ar/en signing tokens. WRITE scope.
  async generatePdfToken({ contractId, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return this.legacy.generatePdfSessionToken({ contractId: Number(contractId) });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PAYMENTS GROUPED LIST (global, role-scoped INSIDE the frozen service)
  // ════════════════════════════════════════════════════════════════════════════
  // GET /payments/all. NOT per-record lead-scoped: the legacy service applies the role
  // scope (admin-tier see all; others scoped to clientLead.userId === user.id). We pass
  // req.auth as `user`, exactly as legacy passed getCurrentUser(req). Preserved 1:1.
  async paymentsGrouped({ page, limit, status, authUser }) {
    return this.legacy.getContractPaymentsGroupedService({ page, limit, status, user: authUser });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  STAGES (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createStage({ contractId, stage, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return this.legacy.createContractStage({ contractId: Number(contractId), stage });
  }

  async updateStage({ contractId, stageId, newStage, authUser }) {
    // Scope by the stage's parent contract → lead, AND verify the stage belongs to the
    // path contract (path ids authoritative). The stage resolver gives us contractId.
    await this.#scopeByResolved({
      resolver: () => this.repo.getStageClientLeadId({ stageId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.updateContractStage({ stageId, newStage });
  }

  async deleteStage({ contractId, stageId, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getStageClientLeadId({ stageId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.deleteContractStage({ stageId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  PAYMENTS (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createPayment({ contractId, payment, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return this.legacy.createNewContractPayment({ contractId, payment });
  }

  async updatePayment({ paymentId, newPayment, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.updateContractPayment({ paymentId, newPayment });
  }

  async deletePayment({ paymentId, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.deleteContractPayment({ paymentId });
  }

  async updatePaymentStatus({ paymentId, status, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.updateContractPaymentStatus({ paymentId, status });
  }

  async updatePaymentAmounts({ paymentId, amountLost, amountReceived, status, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getPaymentClientLeadId({ paymentId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.updateContractPaymentAmounts({ paymentId, amountLost, amountReceived, status });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  DRAWINGS (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createDrawing({ contractId, drawing, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return this.legacy.createContractDrawing({ contractId, drawing });
  }

  async updateDrawing({ drawId, newDrawing, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getDrawingClientLeadId({ drawId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.updateContractDrwaing({ drawId, newDrawing });
  }

  async deleteDrawing({ drawId, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getDrawingClientLeadId({ drawId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.deleteContractDrawing({ drawId });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SPECIAL ITEMS (lead-scoped via the contract)
  // ════════════════════════════════════════════════════════════════════════════
  async createSpecialItem({ contractId, item, authUser }) {
    await this.#scopeByContract({ contractId, authUser, mode: "mutate" });
    return this.legacy.createContractSpecialItem({ contractId, item });
  }

  async updateSpecialItem({ specialItemId, newSpecialItem, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getSpecialItemClientLeadId({ specialItemId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.updateContractSpecialItem({ specialItemId, newSpecialItem });
  }

  async deleteSpecialItem({ specialItemId, authUser }) {
    await this.#scopeByResolved({
      resolver: () => this.repo.getSpecialItemClientLeadId({ specialItemId }),
      authUser,
      mode: "mutate",
    });
    return this.legacy.deleteContractSpecialItem({ specialItemId });
  }
}

export const contractUsecase = new ContractUsecase();
