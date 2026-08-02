import { describe, expect, it, vi } from "vitest";
import multer from "multer";
import { generalMessagesCodes } from "@dms/shared";
import { errorHandler, notFoundHandler } from "../error-handler.js";

function response() {
  const res = {
    status: vi.fn(() => res),
    json: vi.fn(() => res),
  };
  return res;
}

describe("error handler contract", () => {
  it("uses a language-neutral code for unknown routes", () => {
    const next = vi.fn();
    notFoundHandler(
      { method: "GET", originalUrl: "/missing" },
      {},
      next,
    );

    expect(next.mock.calls[0][0]).toMatchObject({
      statusCode: 404,
      message: generalMessagesCodes.NOT_FOUND,
      code: generalMessagesCodes.NOT_FOUND,
    });
  });

  it("maps Multer failures into the standard error envelope", () => {
    const res = response();
    errorHandler(
      new multer.MulterError("LIMIT_FILE_SIZE"),
      { method: "POST", originalUrl: "/files" },
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: generalMessagesCodes.FILE_TOO_LARGE,
        code: generalMessagesCodes.FILE_TOO_LARGE,
        data: null,
        translationKey: "generalMessages",
      }),
    );
  });

  it("never exposes raw unexpected error text", () => {
    const res = response();
    errorHandler(
      new Error("database password leaked"),
      { method: "GET", originalUrl: "/x" },
      res,
      vi.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: generalMessagesCodes.INTERNAL_SERVER_ERROR,
        code: generalMessagesCodes.INTERNAL_SERVER_ERROR,
        data: null,
      }),
    );
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain(
      "database password leaked",
    );
  });
});
