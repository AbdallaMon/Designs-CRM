import { AppError } from "../../shared/errors/AppError.js";
import { PERMISSIONS, siteUtilityMessagesCodes } from "@dms/shared";
import { siteUtilityRepository } from "./site-utility.repository.js";
import {
  computePaymentConditionCapabilities,
  toPaymentConditionDto,
} from "./site-utility.dto.js";

const P = PERMISSIONS.SITE_UTILITY;

// Business logic / orchestration. Prisma never appears here — only repo calls.
// Errors are thrown as AppError(code, statusCode); success values are returned.
export class SiteUtilityUsecase {
  /** @param {import("./site-utility.repository.js").SiteUtilityRepository} repository */
  constructor(repository) {
    this.repository = repository;
  }

  // ── PDF config (SiteUtility singleton) ─────────────────────────────────────

  // GET /pdf-utility — returns the singleton config, lazily creating it on first
  // access (legacy behavior). Unlike legacy (which returned `undefined` right
  // after creating the row), we return the freshly-created row so the caller
  // always gets a config object — observably compatible and strictly better.
  async getPdfConfig() {
    let config = await this.repository.getPdfConfig();
    if (!config) {
      config = await this.repository.createPdfConfig({ data: {} });
    }
    return config;
  }

  // POST /pdf-utility — upsert semantics matching legacy: if the singleton is
  // missing, create it with the supplied fields, otherwise update it. Returns the
  // persisted config (legacy returned `true`; returning the row is more useful and
  // does not change the success outcome).
  async updatePdfConfig({ input }) {
    const existing = await this.repository.getPdfConfig();
    const config = existing
      ? await this.repository.updatePdfConfig({ data: input })
      : await this.repository.createPdfConfig({ data: input });
    return config;
  }

  // ── Contract payment conditions ────────────────────────────────────────────

  // GET /contract-payment-conditions — list. Returns the paginated envelope shape
  // ({ items, total, page, pageSize }) even though the legacy returned a bare
  // array: the dataset is small and unpaginated server-side, so we return all rows
  // in a single page while conforming to the list contract. Each item carries
  // per-record `capabilities.*` (canEdit/canDelete/inUse) for the admin UI.
  async listPaymentConditions({ authUser }) {
    const rows = await this.repository.listPaymentConditions();

    const permissions = authUser?.permissions || [];
    const canEdit = permissions.includes(P.PAYMENT_CONDITION_EDIT);
    const canDelete = permissions.includes(P.PAYMENT_CONDITION_DELETE);

    // A condition is "in use" if any ContractPayment references it. Resolve this
    // per-row so `capabilities.canDelete` reflects the real delete invariant.
    const items = await Promise.all(
      rows.map(async (row) => {
        const linked = await this.repository.findFirstPaymentByConditionId({
          conditionId: row.id,
        });
        return toPaymentConditionDto(
          row,
          computePaymentConditionCapabilities(row, {
            canEdit,
            canDelete,
            inUse: Boolean(linked),
          }),
        );
      }),
    );

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    };
  }

  // POST /contract-payment-conditions — create. Preserves the legacy invariant:
  // the reserved "To Do" condition value may not be created.
  async createPaymentCondition({ input }) {
    if (input.condition === "To Do") {
      throw new AppError(
        siteUtilityMessagesCodes.PAYMENT_CONDITION_RESERVED_VALUE,
        400,
      );
    }
    const created = await this.repository.createPaymentCondition({
      data: input,
    });
    return toPaymentConditionDto(created);
  }

  // PUT /contract-payment-conditions/:id — update an existing condition.
  async updatePaymentCondition({ id, input }) {
    const existing = await this.repository.getPaymentConditionById({ id });
    if (!existing) {
      throw new AppError(
        siteUtilityMessagesCodes.PAYMENT_CONDITION_NOT_FOUND,
        404,
      );
    }
    const updated = await this.repository.updatePaymentCondition({
      id,
      data: input,
    });
    return toPaymentConditionDto(updated);
  }

  // DELETE /contract-payment-conditions/:id — delete, preserving the legacy guard:
  // a condition still linked to existing contract payments cannot be deleted.
  async deletePaymentCondition({ id }) {
    const existing = await this.repository.getPaymentConditionById({ id });
    if (!existing) {
      throw new AppError(
        siteUtilityMessagesCodes.PAYMENT_CONDITION_NOT_FOUND,
        404,
      );
    }
    const linked = await this.repository.findFirstPaymentByConditionId({
      conditionId: id,
    });
    if (linked) {
      throw new AppError(
        siteUtilityMessagesCodes.PAYMENT_CONDITION_IN_USE,
        409,
      );
    }
    await this.repository.deletePaymentCondition({ id });
    return { id };
  }
}

export const siteUtilityUsecase = new SiteUtilityUsecase(siteUtilityRepository);
