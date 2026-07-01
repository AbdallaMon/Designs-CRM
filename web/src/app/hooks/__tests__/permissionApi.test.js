import { describe, it, expect } from "vitest";
import { makePermissionApi } from "../permissionApi.js";

describe("makePermissionApi", () => {
  const api = makePermissionApi(["lead.list", "lead.view"], { lead: { canList: true } });

  it("hasPermission / any / all", () => {
    expect(api.hasPermission("lead.list")).toBe(true);
    expect(api.hasPermission("lead.edit")).toBe(false);
    expect(api.hasAnyPermission(["lead.edit", "lead.view"])).toBe(true);
    expect(api.hasAllPermissions(["lead.list", "lead.view"])).toBe(true);
    expect(api.hasAllPermissions(["lead.list", "lead.edit"])).toBe(false);
  });

  it("hasAction reads permissionsByModule flags", () => {
    expect(api.hasAction("lead", "canList")).toBe(true);
    expect(api.hasAction("lead", "canEdit")).toBe(false);
  });
});
