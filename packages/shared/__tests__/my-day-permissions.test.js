import { permissionsForPersona, profileForPersona } from "./profile-fixtures.js";
// my_day.view / my_day.team.view wiring — additive codes for the My Day work queue.
// Sales tiers + designers get the personal queue; SUPER_SALES + ADMIN/SUPER_ADMIN get
// the team lens; admins deliberately have NO personal queue (spec §3).
import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PROFILES,
  USER_ROLES,
  NAVIGATION,
  myDayMessagesCodes,
  messagesNames,
} from "../index.js";

const P = PERMISSIONS;
const VIEW = P.MY_DAY.VIEW;
const TEAM = P.MY_DAY.TEAM_VIEW;
const R = USER_ROLES;

describe("my_day permission wiring", () => {
  it("registers both codes in the aggregate + ALL_PERMISSIONS", () => {
    expect(VIEW).toBe("my_day.view");
    expect(TEAM).toBe("my_day.team.view");
    expect(ALL_PERMISSIONS).toContain(VIEW);
    expect(ALL_PERMISSIONS).toContain(TEAM);
  });

  it("grants the personal queue to sales + designer base roles (legacy fallback map)", () => {
    for (const role of [R.STAFF, R.SUPER_SALES, R.THREE_D_DESIGNER, R.TWO_D_DESIGNER, R.TWO_D_EXECUTOR]) {
      expect(permissionsForPersona(role)).toContain(VIEW);
    }
  });

  it("grants the team lens to ADMIN/SUPER_ADMIN/SUPER_SALES roles ONLY", () => {
    for (const role of [R.ADMIN, R.SUPER_ADMIN, R.SUPER_SALES]) {
      expect(permissionsForPersona(role)).toContain(TEAM);
    }
    for (const role of [R.STAFF, R.THREE_D_DESIGNER, R.TWO_D_DESIGNER, R.TWO_D_EXECUTOR, R.ACCOUNTANT, R.CONTACT_INITIATOR]) {
      expect(permissionsForPersona(role)).not.toContain(TEAM);
    }
  });

  it("admins hold both personal and team queues through all-permissions access", () => {
    expect(permissionsForPersona(R.ADMIN)).toContain(VIEW);
    expect(permissionsForPersona(R.SUPER_ADMIN)).toContain(VIEW);
    expect(PROFILES.ADMIN).toContain(VIEW);
    expect(PROFILES.SUPER_ADMIN).toContain(VIEW);
    expect(PROFILES.ADMIN).toContain(TEAM);
  });

  it("profiles: sales tiers + designers hold the personal queue", () => {
    for (const key of ["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES", "DESIGNER_3D", "DESIGNER_2D", "EXECUTOR_2D"]) {
      expect(PROFILES[key]).toContain(VIEW);
    }
  });

  it("profiles: only SUPER_SALES tiers + admins hold the team lens", () => {
    for (const key of ["SUPER_SALES", "ADMIN", "SUPER_ADMIN"]) {
      expect(PROFILES[key]).toContain(TEAM);
    }
    for (const key of ["NORMAL_SALES", "PRIMARY_SALES", "DESIGNER_3D", "DESIGNER_2D", "EXECUTOR_2D", "ACCOUNTANT", "CONTACT_INITIATOR"]) {
      expect(PROFILES[key]).not.toContain(TEAM);
    }
  });

  it("accountant + contact-initiator hold the personal queue (2026-07-15 additive: collections + first-touch queues)", () => {
    expect(PROFILES.ACCOUNTANT).toContain(VIEW);
    expect(PROFILES.CONTACT_INITIATOR).toContain(VIEW);
    expect(permissionsForPersona(R.ACCOUNTANT)).toContain(VIEW);
    expect(permissionsForPersona(R.CONTACT_INITIATOR)).toContain(VIEW);
  });

  // ⏸️ 2026-07-16 (user request): the My Day nav row is COMMENTED OUT in navigation.js and
  // the page renders blank. The permission codes + grants below stay wired (the backend
  // endpoints still work), so restoring the screen is un-commenting the row + the page.
  it("NAVIGATION does NOT carry the My Day tab while the screen is disabled", () => {
    expect(NAVIGATION.find((t) => t.key === "my-day")).toBeUndefined();
  });

  it("registers the my-day message codes + translation bucket", () => {
    expect(myDayMessagesCodes.MY_DAY_FETCHED).toBe("MY_DAY_FETCHED");
    expect(myDayMessagesCodes.MY_DAY_TEAM_SCOPE_DENIED).toBe("MY_DAY_TEAM_SCOPE_DENIED");
    expect(messagesNames.myDayMessages).toBe("myDayMessages");
  });
});
