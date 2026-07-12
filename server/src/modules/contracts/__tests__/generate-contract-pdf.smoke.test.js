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
beforeAll(async () => {
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

describe("generateContractPdf (structural smoke)", () => {
  it.each(["ar", "en"])("produces a valid PDF (%s)", async (lng) => {
    const bytes = await generateContractPdf({
      contract: fixtureContract(),
      lng,
      clientName: "Test Client",
      signatureUrl: "/uploads/client-sig.png",
      signaturePartUrl: "/dream-signature.png",
      backgroundImageUrl: "/uploads/bg.jpg",
      introImageUrl: "/Pdf-intro.png",
      defaultContractUtilityData: utility,
    });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(bytes.slice(0, 4)).toString()).toBe("%PDF");
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
