import { describe, it, expect, vi, beforeAll } from "vitest";

// Valid 1x1 transparent PNG returned for every image fetch so the drawing pipeline
// (background / intro / stamp / signature / drawings) runs end-to-end.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

vi.mock("../../../infra/pdf/pdf-helpers.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchImageBuffer: vi.fn().mockResolvedValue(PNG_1x1) };
});

let generateContractPdf;
let fetchImageBuffer;
beforeAll(async () => {
  ({ fetchImageBuffer } = await import("../../../infra/pdf/pdf-helpers.js"));
  ({ generateContractPdf } = await import(
    "../services/generate-contract-pdf.js"
  ));
});

function fixtureContract() {
  return {
    id: 1,
    clientLeadId: 1,
    title: "عقد تجريبي",
    enTitle: "Test Contract",
    amount: 10000,
    totalAmount: 10000,
    taxRate: 5,
    clientLead: {
      id: 1,
      code: "LEAD-1",
      client: {
        name: "Test Client",
        email: "a@b.com",
        phone: "100",
        city: "Dubai",
        country: "UAE",
      },
    },
    stages: [],
    paymentsNew: [],
    payments: [],
    drawings: [],
    specialItems: [],
  };
}

const utility = {
  levelClauses: [],
  specialClauses: [],
  stageClauses: [],
  obligationsPartyOneAr: "التزامات",
  obligationsPartyOneEn: "Obligations one",
  obligationsPartyTwoAr: "التزامات",
  obligationsPartyTwoEn: "Obligations two",
};

// Clauses as the editor actually writes them: `level`/`heading` filled correctly,
// but `order` at its DB default 0 (level clauses) or 0-indexed (stage clauses).
// The PDF must key level clauses by `level` and render every stage-clause row.
const utilityWithClauses = {
  ...utility,
  levelClauses: [
    { id: 1, level: "LEVEL_1", order: 0, textAr: "بند المرحلة الأولى نص طويل يظهر داخل الجدول", textEn: "Stage one clause body text rendered in the table" },
    { id: 2, level: "LEVEL_2", order: 0, textAr: "بند المرحلة الثانية", textEn: "Stage two clause body" },
  ],
  stageClauses: [
    { id: 1, order: 0, headingAr: "بنود المرحلة الأولى", headingEn: "Stage One Clauses", titleAr: "تعريف المرحلة", titleEn: "Stage definition", descriptionAr: "وصف تفصيلي للبنود", descriptionEn: "Detailed clause description" },
    { id: 2, order: 1, headingAr: "بنود المرحلة الثانية", headingEn: "Stage Two Clauses", titleAr: "تعريف", titleEn: "Definition", descriptionAr: "وصف", descriptionEn: "Description" },
  ],
};

function render(lng, defaultContractUtilityData) {
  return generateContractPdf({
    contract: fixtureContract(),
    lng,
    clientName: "Test Client",
    signatureUrl: "/uploads/client-sig.png",
    signaturePartUrl: "/dream-signature.png",
    backgroundImageUrl: "/uploads/bg.jpg",
    introImageUrl: "/Pdf-intro.png",
    defaultContractUtilityData,
  });
}

describe("generateContractPdf (structural smoke)", () => {
  it.each(["ar", "en"])("produces a valid PDF (%s)", async (lng) => {
    const bytes = await render(lng, utility);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(1000);
    expect(fetchImageBuffer).toHaveBeenCalledWith("/Pdf-intro.png");
  });

  // Regression guard: level clauses (matched by `level`) and stage clauses (all rows)
  // must render even though every `order` is 0 / 0-indexed — the exact shape the editor
  // writes. A blank section (the old order-based lookup) produces a smaller PDF.
  it.each(["ar", "en"])("renders clauses keyed by level, not order (%s)", async (lng) => {
    const [withClauses, withoutClauses] = await Promise.all([
      render(lng, utilityWithClauses),
      render(lng, utility),
    ]);
    expect(Buffer.from(withClauses.slice(0, 4)).toString()).toBe("%PDF");
    expect(withClauses.length).toBeGreaterThan(withoutClauses.length);
  });
});
