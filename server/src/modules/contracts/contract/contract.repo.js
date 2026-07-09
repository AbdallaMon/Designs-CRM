// contracts/contract repository — Prisma I/O ONLY (no business rules, no AppError, no
// legacy-service calls). Its job is the OBJECT-SCOPE RESOLUTION the legacy routes were
// missing: given a `:contractId` (or a child id — paymentId / stageId / drawingId /
// specialItemId), resolve the row's parent `clientLeadId` so the usecase can run the
// leads-module scope checker BEFORE touching the heavy legacy contract service.
//
// All the heavy contract CRUD logic (create/update/delete of contracts, stages, payments,
// drawings, special items + PDF generation) stays in the FROZEN legacy service and is
// invoked from the usecase via lazy adapters — it is NOT duplicated here. The reads below
// are minimal id-resolution lookups only.
import prisma from "../../../infra/prisma/prisma.js";

class ContractRepository {
  // Resolve a contract → its parent clientLeadId (the scope key). Returns null if the
  // contract does not exist (the usecase maps that to NOT_FOUND / denial).
  async getContractClientLeadId({ contractId }) {
    const row = await prisma.contract.findUnique({
      where: { id: Number(contractId) },
      select: { id: true, clientLeadId: true },
    });
    return row;
  }

  // Resolve a payment → its parent contract's clientLeadId.
  async getPaymentClientLeadId({ paymentId }) {
    const row = await prisma.contractPayment.findUnique({
      where: { id: Number(paymentId) },
      select: { id: true, contractId: true, contract: { select: { clientLeadId: true } } },
    });
    if (!row) return null;
    return { id: row.id, contractId: row.contractId, clientLeadId: row.contract?.clientLeadId ?? null };
  }

  // Resolve a stage → its parent contract's clientLeadId.
  async getStageClientLeadId({ stageId }) {
    const row = await prisma.contractStage.findUnique({
      where: { id: Number(stageId) },
      select: { id: true, contractId: true, contract: { select: { clientLeadId: true } } },
    });
    if (!row) return null;
    return { id: row.id, contractId: row.contractId, clientLeadId: row.contract?.clientLeadId ?? null };
  }

  // Resolve a drawing → its parent contract's clientLeadId.
  async getDrawingClientLeadId({ drawId }) {
    const row = await prisma.contractDrawing.findUnique({
      where: { id: Number(drawId) },
      select: { id: true, contractId: true, contract: { select: { clientLeadId: true } } },
    });
    if (!row) return null;
    return { id: row.id, contractId: row.contractId, clientLeadId: row.contract?.clientLeadId ?? null };
  }

  // Resolve a special item → its parent contract's clientLeadId.
  async getSpecialItemClientLeadId({ specialItemId }) {
    const row = await prisma.contractSpecialItem.findUnique({
      where: { id: Number(specialItemId) },
      select: { id: true, contractId: true, contract: { select: { clientLeadId: true } } },
    });
    if (!row) return null;
    return { id: row.id, contractId: row.contractId, clientLeadId: row.contract?.clientLeadId ?? null };
  }
}

export const contractRepository = new ContractRepository();
