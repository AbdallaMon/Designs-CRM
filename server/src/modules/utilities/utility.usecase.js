import { AppError } from "../../shared/errors/AppError.js";
import {
  PROFILE_FAMILIES,
  PROFILES,
  authMessagesCodes,
  hasAnyPermission,
  PERMISSIONS,
  utilitiesMessagesCodes,
  UTILITY_MODEL_ALLOWLIST,
  UTILITY_MODEL_PROJECTIONS,
} from "@dms/shared";
import { utilityRepository } from "./utility.repo.js";

const P = PERMISSIONS;

export class UtilityUsecase {
  #resolveModelProjection(model) {
    if (!UTILITY_MODEL_ALLOWLIST.includes(model) || !UTILITY_MODEL_PROJECTIONS[model]) {
      throw new AppError({ code: utilitiesMessagesCodes.MODEL_NOT_ALLOWED, statusCode: 400 });
    }
    return UTILITY_MODEL_PROJECTIONS[model];
  }

  #assertSearchPermission(resource, authUser) {
    if (authUser?.isAdminTier) return;
    const required =
      resource === "users"
        ? [P.USER.DIRECTORY, P.USER.LIST, P.ACCOUNTING.USER_LIST, P.COURSE.ATTEMPT_MANAGE]
        : [P.LEAD.LIST, P.PROJECT.LIST, P.ACCOUNTING.PAYMENT_LIST];
    if (!hasAnyPermission(authUser?.permissions, required)) {
      throw new AppError({ code: authMessagesCodes.PERMISSION_DENIED, statusCode: 403 });
    }
  }

  #leadScope(authUser) {
    if (
      authUser?.isAdminTier ||
      authUser?.currentProfileKey === PROFILES.SUPER_SALES ||
      authUser?.currentProfileKey === PROFILES.ACCOUNTANT ||
      authUser?.currentProfileKey === PROFILES.CONTACT_INITIATOR
    ) {
      return {};
    }
    if (authUser?.profileFamily === PROFILE_FAMILIES.DESIGN) {
      return {
        projects: {
          some: { assignments: { some: { userId: Number(authUser.id) } } },
        },
      };
    }
    if (authUser?.profileFamily === PROFILE_FAMILIES.SALES) {
      // Search is a lookup inside the caller's deal set, not the claimable NEW
      // pool. `master` passed the current staff id to the shared search from the
      // deal/Kanban surfaces, so normal and primary sales only saw their own
      // leads. SUPER_SALES was excluded from that narrowing above.
      return { userId: Number(authUser.id) };
    }
    throw new AppError({ code: authMessagesCodes.ACCESS_DENIED, statusCode: 403 });
  }

  listFixedData() {
    return utilityRepository.listFixedData();
  }

  checkUserLog({ query, authUser }) {
    return utilityRepository.userLogExists({
      userId: authUser.id,
      startTime: query.startTime,
      endTime: query.endTime,
    });
  }

  submitUserLog({ body, authUser }) {
    return utilityRepository.createUserLog({
      userId: authUser.id,
      date: body.date,
      description: body.description,
      totalMinutes: body.totalMinutes,
    });
  }

  getUserCurrentProfile({ userId }) {
    return utilityRepository.getUserCurrentProfile({ userId });
  }

  getAdmins() {
    return utilityRepository.getAdmins();
  }

  getImages({ query }) {
    const toIdList = (csv) =>
      csv
        ? csv
            .split(",")
            .map((id) => Number(id))
            .filter(Boolean)
        : [];
    return utilityRepository.listImages({
      patternIdList: toIdList(query.patternIds),
      spaceIdList: toIdList(query.spaceIds),
    });
  }

  getModelData({ query }) {
    const select = this.#resolveModelProjection(query.model);
    return utilityRepository.findModelPickList({ model: query.model, select });
  }

  getModelIds({ query }) {
    return this.getModelData({ query });
  }

  search({ query, authUser }) {
    this.#assertSearchPermission(query.resource, authUser);
    if (query.resource === "users") {
      return utilityRepository.searchUsers({
        query: query.query,
        profileKey: query.profile,
      });
    }

    const leadScope = this.#leadScope(authUser);
    if (query.resource === "clients") {
      return utilityRepository.searchClients({
        query: query.query,
        leadScope:
          authUser?.isAdminTier || authUser?.currentProfileKey === PROFILES.ACCOUNTANT
            ? null
            : leadScope,
      });
    }
    return utilityRepository.searchLeads({
      query: query.query,
      leadScope,
    });
  }
}

export const utilityUsecase = new UtilityUsecase();
