import { getEffectivePermissions } from "../helpers.js";

const PROFILE_BY_PERSONA = Object.freeze({
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
  STAFF: "NORMAL_SALES",
  SUPER_SALES: "SUPER_SALES",
  ACCOUNTANT: "ACCOUNTANT",
  THREE_D_DESIGNER: "DESIGNER_3D",
  TWO_D_DESIGNER: "DESIGNER_2D",
  TWO_D_EXECUTOR: "EXECUTOR_2D",
  CONTACT_INITIATOR: "CONTACT_INITIATOR",
});

export function profileForPersona(persona, { superSales = false } = {}) {
  if (superSales) return "SUPER_SALES";
  return PROFILE_BY_PERSONA[persona] ?? persona;
}

export function permissionsForPersona(persona, options) {
  return getEffectivePermissions({
    profile: profileForPersona(persona, options),
  }).permissions;
}
