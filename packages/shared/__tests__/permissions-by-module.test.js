import { describe, it, expect } from "vitest";
import { buildPermissionsByModule } from "../helpers.js";

describe("buildPermissionsByModule", () => {
  it("groups codes by module and sets nav action flags", () => {
    const { permissions, permissionsByModule } = buildPermissionsByModule([
      "lead.list",
      "lead.view",
      "contract.create",
    ]);
    expect(new Set(permissions)).toEqual(
      new Set(["lead.list", "lead.view", "contract.create"]),
    );
    expect(permissionsByModule.lead.codes).toContain("lead.view");
    expect(permissionsByModule.contract.codes).toEqual(["contract.create"]);
  });

  it("dedupes and tolerates empty / non-array input", () => {
    expect(buildPermissionsByModule([]).permissions).toEqual([]);
    expect(buildPermissionsByModule(undefined).permissions).toEqual([]);
    expect(buildPermissionsByModule(["a.b", "a.b"]).permissions).toEqual(["a.b"]);
  });
});
