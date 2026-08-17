import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import prisma from "../server/src/infra/prisma/prisma.js";
import { PDF_ASSET_DEFAULTS } from "../server/src/infra/pdf/pdf-asset-defaults.js";
import { generateContractPdf } from "../server/src/modules/contracts/services/generate-contract-pdf.js";
import { generateImageSessionPdf } from "../server/src/modules/image-sessions/services/generate-image-session-pdf.js";

const outputDir = path.resolve("output/pdf");
await mkdir(outputDir, { recursive: true });

const siteUtility = await prisma.siteUtility.findUnique({ where: { id: 1 } });
const contractUtility = await prisma.contractUtility.findFirst({
  include: {
    stageClauses: { orderBy: { order: "asc" } },
    specialClauses: { orderBy: { order: "asc" } },
    levelClauses: { orderBy: { order: "asc" } },
  },
});

const utility = contractUtility || {
  obligationsPartyOneAr: "",
  obligationsPartyOneEn: "",
  obligationsPartyTwoAr: "",
  obligationsPartyTwoEn: "",
  stageClauses: [],
  specialClauses: [],
  levelClauses: [],
};

const contract = {
  id: 0,
  clientLeadId: 0,
  title: "Layout QA Contract",
  enTitle: "Layout QA Contract",
  amount: 10000,
  totalAmount: 10500,
  taxRate: 5,
  clientLead: {
    id: 0,
    code: "QA-ONLY",
    client: {
      name: "Layout QA Client",
      enName: "Layout QA Client",
      email: "qa@example.test",
      phone: "0000000000",
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

const contractBytes = await generateContractPdf({
  contract,
  lng: "en",
  backgroundImageUrl: siteUtility?.pdfFrame || PDF_ASSET_DEFAULTS.pdfFrame,
  introImageUrl: siteUtility?.introPage || PDF_ASSET_DEFAULTS.introPage,
  signaturePartUrl:
    siteUtility?.pdfSignaturePart || PDF_ASSET_DEFAULTS.pdfSignaturePart,
  defaultContractUtilityData: utility,
});
await writeFile(path.join(outputDir, "contract-layout-qa.pdf"), contractBytes);

const imageSessionBytes = await generateImageSessionPdf({
  sessionData: {},
  lng: "en",
  name: "Layout QA Client",
});
await writeFile(
  path.join(outputDir, "image-session-layout-qa.pdf"),
  imageSessionBytes,
);

await prisma.$disconnect();
