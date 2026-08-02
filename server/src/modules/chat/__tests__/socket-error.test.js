import { describe, expect, it } from "vitest";
import {
  chatMessagesCodes,
  generalMessagesCodes,
} from "@dms/shared";
import { AppError } from "../../../shared/errors/AppError.js";
import { socketErrorEnvelope } from "../handlers/socket-error.js";

describe("socketErrorEnvelope", () => {
  it("preserves a coded domain error", () => {
    const error = new AppError({
      code: chatMessagesCodes.ROOM_ACCESS_DENIED,
      statusCode: 403,
      translationKey: "chatMessages",
      details: { roomId: 2 },
    });

    expect(socketErrorEnvelope(error)).toEqual({
      success: false,
      message: chatMessagesCodes.ROOM_ACCESS_DENIED,
      code: chatMessagesCodes.ROOM_ACCESS_DENIED,
      data: null,
      translationKey: "chatMessages",
      details: { roomId: 2 },
    });
  });

  it("shields unexpected error text", () => {
    const result = socketErrorEnvelope(
      new Error("database password leaked"),
    );

    expect(result.message).toBe(
      generalMessagesCodes.UNEXPECTED_ERROR,
    );
    expect(JSON.stringify(result)).not.toContain(
      "database password leaked",
    );
  });
});
