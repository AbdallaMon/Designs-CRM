import { describe, expect, it } from "vitest";

import { getSlotSelectionErrorMessage } from "../clientBookingHelpers.js";

describe("client booking slot errors", () => {
  it("extracts the resolved message from getData's rich error object", () => {
    expect(
      getSlotSelectionErrorMessage({
        status: 409,
        message: "SLOT_ALREADY_BOOKED",
        error: {
          message: "The selected slot is already booked",
          redirectTo: null,
        },
      }),
    ).toBe("The selected slot is already booked");
  });

  it("resolves a booking error envelope when no rich error object is present", () => {
    expect(
      getSlotSelectionErrorMessage({
        status: 409,
        message: "SLOT_ALREADY_BOOKED",
      }),
    ).toBe("The selected slot is already booked");
  });
});
