// In-process profile→codes permission cache. Resolves a currentProfileId to its
// effective permission set with ZERO per-request DB reads (the auth middleware
// hot path). Profiles are few and stable; the cache is loaded on boot and
// invalidated whenever the profile catalog changes (seed / profile edit).
import { buildPermissionsByModule } from "@dms/shared";
import { profileCacheRepository } from "./profile-cache.repository.js";

export function createProfileCache({ repository = profileCacheRepository } = {}) {
  let byId = new Map();

  async function load() {
    const rows = await repository.loadProfilesWithCodes();
    const next = new Map();
    for (const p of rows) {
      const { permissions, permissionsByModule } = buildPermissionsByModule(p.codes);
      next.set(p.id, {
        key: p.key,
        isAdminTier: Boolean(p.isAdminTier),
        baseRole: p.baseRole,
        permissions,
        permissionsByModule,
      });
    }
    byId = next;
  }

  return {
    load,
    invalidate: load,
    resolve(profileId) {
      if (profileId == null) return null;
      return byId.get(Number(profileId)) ?? null;
    },
    get size() {
      return byId.size;
    },
  };
}

// The app-wide singleton (loaded on boot in server.js).
export const profileCache = createProfileCache();
