import { describe, expect, it } from "vitest";
import { bookingLeadSchemas } from "../booking-leads.validation.js";

describe("booking lead PATCH validation", () => {
  it("accepts exactly one supported field", () => {
    expect(
      bookingLeadSchemas.patchBookingLead.safeParse({
        location: "Dubai",
      }).success,
    ).toBe(true);
  });

  it("rejects multiple fields", () => {
    expect(
      bookingLeadSchemas.patchBookingLead.safeParse({
        location: "Dubai",
        projectType: "Villa",
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(
      bookingLeadSchemas.patchBookingLead.safeParse({
        unsupported: "value",
      }).success,
    ).toBe(false);
  });
});
