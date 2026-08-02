import { describe, expect, it, vi } from "vitest";
import { generalMessagesCodes } from "@dms/shared";
import {
  badRequest,
  created,
  deleted,
  ok,
} from "../response.js";

function response() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res;
}

describe("response envelope", () => {
  it("uses canonical defaults for success responses", () => {
    const res = response();
    ok(res, { id: 1 });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: generalMessagesCodes.OK,
      data: { id: 1 },
      translationKey: "generalMessages",
    });
  });

  it("keeps create and delete responses in the same shape", () => {
    const createdRes = response();
    created(createdRes, { id: 2 });
    expect(createdRes.json).toHaveBeenCalledWith({
      success: true,
      message: generalMessagesCodes.CREATED,
      data: { id: 2 },
      translationKey: "generalMessages",
    });

    const deletedRes = response();
    deleted(deletedRes);
    expect(deletedRes.json).toHaveBeenCalledWith({
      success: true,
      message: generalMessagesCodes.DELETED,
      data: null,
      translationKey: "generalMessages",
    });
  });

  it("uses data:null for helper-generated errors", () => {
    const res = response();
    badRequest(res);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: generalMessagesCodes.BAD_REQUEST,
      data: null,
      translationKey: "generalMessages",
      details: null,
    });
  });

  it("rejects raw prose", () => {
    expect(() => ok(response(), null, "Human message")).toThrow(
      TypeError,
    );
  });
});
