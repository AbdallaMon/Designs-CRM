// Generic model delete — the business logic is the FROZEN legacy service
// (services/main/shared/deleteAModel). We only wrap it: authentication + the model
// allow-list are enforced at the route/validation layer; the frozen service keeps the exact
// behavior (non-admin 5-minute window, super-sales 2-day window, MeetingReminder calendar
// cleanup). Prisma never appears here.
import { AppError } from "../../shared/errors/AppError.js";

const legacyDefaults = {
  deleteAModel: (a) =>
    import("../../../services/main/shared/index.js").then((m) => m.deleteAModel(a)),
};

export class GenericDeleteUsecase {
  constructor(legacy = {}) {
    this.legacy = { ...legacyDefaults, ...legacy };
  }

  isAdminUser(authUser) {
    return authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN";
  }

  async remove({ id, body, authUser }) {
    if (!body?.model) throw new AppError("DELETE_MODEL_REQUIRED", 400);
    // NOTE: `deleteModelesBeforeMain` is intentionally NOT forwarded (the schema strips it),
    // so this endpoint can never cascade-delete arbitrary models.
    return this.legacy.deleteAModel({
      id: Number(id),
      isAdmin: this.isAdminUser(authUser),
      isSuperSales: Boolean(authUser?.isSuperSales),
      data: { model: body.model },
    });
  }
}

export const genericDeleteUsecase = new GenericDeleteUsecase();
