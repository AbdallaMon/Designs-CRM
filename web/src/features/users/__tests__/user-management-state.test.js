import { describe, expect, it } from "vitest";
import {
  applyProfilesToUserRows,
  mergeUserManagementRow,
} from "../user-management-state.js";

const profiles = [
  { id: 2, key: "NORMAL_SALES", label: "Sales", family: "SALES" },
  { id: 3, key: "PRIMARY_SALES", label: "Primary sales", family: "SALES" },
];

describe("user management row state", () => {
  it("preserves relational profile fields when an identity edit returns only identity data", () => {
    const existing = {
      id: 7,
      name: "Old",
      currentProfileId: 2,
      currentProfile: profiles[0],
      userProfiles: [{ profileId: 2, profile: profiles[0] }],
    };

    expect(mergeUserManagementRow(existing, { id: 7, name: "New" })).toEqual({
      ...existing,
      name: "New",
    });
  });

  it("updates assigned and active profiles locally after profile save", () => {
    const rows = [
      {
        id: 7,
        name: "Sales user",
        currentProfileId: 2,
        currentProfile: profiles[0],
        userProfiles: [{ profileId: 2, profile: profiles[0] }],
      },
    ];

    const updated = applyProfilesToUserRows(rows, {
      userId: 7,
      profileIds: [3],
      currentProfileId: 3,
      availableProfiles: profiles,
    });

    expect(updated[0]).toMatchObject({
      currentProfileId: 3,
      currentProfile: profiles[1],
      userProfiles: [{ profileId: 3, profile: profiles[1] }],
    });
  });
});
