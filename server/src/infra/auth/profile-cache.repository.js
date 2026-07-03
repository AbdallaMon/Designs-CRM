// The ONE Prisma read the profile cache uses: every profile with its permission
// codes flattened. Prisma lives only in repositories (layering rule).
import prisma from "@dms/db";

export const profileCacheRepository = {
  async loadProfilesWithCodes() {
    const rows = await prisma.profile.findMany({
      select: {
        id: true,
        key: true,
        label: true,
        family: true,
        isAdminTier: true,
        baseRole: true,
        permissionLinks: { select: { permissionCode: { select: { code: true } } } },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      key: p.key,
      label: p.label,
      family: p.family,
      isAdminTier: p.isAdminTier,
      baseRole: p.baseRole,
      codes: p.permissionLinks.map((l) => l.permissionCode.code),
    }));
  },
};
