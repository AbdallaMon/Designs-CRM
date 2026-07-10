import { describe, it, expect } from "vitest";
import { getVisibleLeadSections } from "../leadSections";

// Build a ctx for an archetype: `codes` is the user's effective permission set.
function ctxFor({ codes = [], status = "IN_PROGRESS", payments = [] }) {
  const set = new Set(codes);
  return {
    lead: { id: 1, status, callReminders: [], meetingReminders: [], notes: [], priceOffers: [], files: [] },
    user: {},
    perms: { hasPermission: (c) => set.has(c) },
    admin: false, isPrimaryStaff: false, notUser: false,
    payments,
    setLead() {}, setleads() {}, setPayments() {},
  };
}
const keys = (ctx) => getVisibleLeadSections(ctx).map((s) => s.key);
const ALL_VIEW = ["lead.price_offer.view","lead.projects.view","lead.modifications.view","lead.updates.view","lead.analysis.view"];

describe("leadSections visibility by permission code", () => {
  it("a user with NO view codes sees only the always-on sections", () => {
    const k = keys(ctxFor({ codes: [] }));
    expect(k).toEqual(expect.arrayContaining(["details","salesStage","calls","meetings","notes","files","chats"]));
    for (const gated of ["analysis","priceOffers","projects","modifications","updates"]) expect(k).not.toContain(gated);
  });

  it("analysis shows with the analysis view code", () => {
    expect(keys(ctxFor({ codes: ["lead.analysis.view"] }))).toContain("analysis");
  });

  it("primary/admin (all view codes) see the commercial + delivery sections when applicable", () => {
    const k = keys(ctxFor({ codes: ALL_VIEW, status: "FINALIZED" }));
    for (const g of ["analysis","priceOffers","projects","modifications","updates"]) expect(k).toContain(g);
  });

  it("updates requires FINALIZED even with the code", () => {
    expect(keys(ctxFor({ codes: ALL_VIEW, status: "IN_PROGRESS" }))).not.toContain("updates");
  });

  it("extraServices still keys off payments, not a code", () => {
    expect(keys(ctxFor({ codes: [], payments: [{ id: 1 }] }))).toContain("extraServices");
  });
});
