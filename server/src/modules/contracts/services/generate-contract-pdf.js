// server/services/main/contract/generateContractPdf.js
import { PDFDocument, rgb, degrees } from "pdf-lib";
import {
  fetchImageBuffer,
  getRTLTextX,
  reText,
  splitTextIntoLines,
  enfontBoldBase64,
  enfontBase64,
  fontBoldBase64,
  fontBase64,
  isArabicText,
  formatAED,
  formatNumber,
  formatDate,
  reverseString,
} from "../../../infra/pdf/pdf-helpers.js";
import { uploadToFTPHttpAsBuffer } from "../../../infra/upload/ftp-upload.js";
import prisma from "../../../infra/prisma/prisma.js";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import * as fontkit from "fontkit";
import "dayjs/locale/ar.js";
import "dayjs/locale/en.js";

// ====== IMPORT ALL FRONTEND DATA EXACTLY ======
import {
  STAGE_CLAUSES_DEFAULT,
  OBLIGATIONS_TEXT,
  FIXED_TEXT,
  PAYMENT_ORDINAL,
  STAGE_PROGRESS,
  HANDWRITTEN_SPECIAL_CLAUSES,
  CONTRACT_LEVELSENUM,
  COUNTRY_LABEL,
  EMIRATE_LABEL,
  UAE_LABEL,
  STAGE_STATUS_LABEL,
  PROJECT_TYPES_LABELS,
} from "./witten-blocks-data.js";
import { notifyUsersThatAContractWasSigned } from "../../../infra/telegram/telegram-functions.js";
import { sendSuccessEmailAfterContractSigned } from "./pdf-utilities.js";
import { updateContractPaymentOnContractSign } from "./contract-services.js";
import { getDefaultContractUtilityData } from "./client-contract-services.js";
import { PDF_ASSET_DEFAULTS } from "../../../infra/pdf/pdf-asset-defaults.js";
import { PDF_COLORS } from "../../../infra/pdf/pdf-theme.js";
import { drawFullBackgroundImage } from "../../../infra/pdf/pdf-draw.js";

// ===== Helpers =====
import { createPdfContext, pickFontsForText, ASCII_RE } from "./contract-pdf-context.js";
import { renderIntroPage } from "./sections/intro.js";
import { renderClientSection } from "./sections/client.js";
import { renderAmountSection } from "./sections/amount.js";
import { renderDbSpecialItems } from "./sections/special-items.js";
import { renderPartyOneWithPayments } from "./sections/party-one-payments.js";
import { renderStagesCards, renderStagesTable } from "./sections/stages.js";
import { renderStageClauses } from "./sections/stage-clauses.js";
import { renderPartyTwoObligations } from "./sections/party-two-obligations.js";
import { renderHandwrittenSpecialClauses } from "./sections/handwritten-clauses.js";
import { renderDrawingsSection } from "./sections/drawings.js";
import { renderConfirmationAndSignaturePage } from "./sections/signature.js";
import { renderFooterPageNumbers } from "./sections/footer.js";
import { drawCancelledWatermarkOnAllPages } from "./sections/watermark.js";

export async function generateContractPdf({
  contract,
  lng = "ar",
  signatureUrl,
  signaturePartUrl,
  backgroundImageUrl,
  introImageUrl,
  // layout
  pageWidth = 600,
  pageHeight = 800,
  padding = { top: 72, right: 56, bottom: 72, left: 56 },
  defaultDrawingUrl = null,
  canceled = false,
  cancelWatermarkTextAr = "تم إلغاء هذا العقد",
  cancelWatermarkTextEn = "THIS CONTRACT HAS BEEN CANCELLED",
  defaultContractUtilityData,
}) {
  console.log(introImageUrl, "introImageUrl");
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const owner = contract?.clientLead?.client;
  const clientName =
    (lng === "ar" ? owner?.arName : owner?.enName || owner?.arName) ||
    owner?.name;
  const arFont = await pdfDoc.embedFont(fontBase64);
  const arBold = await pdfDoc.embedFont(fontBoldBase64);
  const enFont = await pdfDoc.embedFont(enfontBase64);
  const enBold = await pdfDoc.embedFont(enfontBoldBase64);
  const fonts = { arFont, arBold, enFont, enBold };

  // Palette
  const colors = PDF_COLORS;

  const margin = {
    top: padding.top,
    right: padding.right,
    bottom: padding.bottom,
    left: padding.left,
  };

  const ctx = createPdfContext({
    pdfDoc,
    pageWidth,
    pageHeight,
    margin,
    startTopOffset: 80,
    lng,
  });
  ctx.pdfDoc = pdfDoc;
  ctx.drawBg = async (pg) => {
    await drawFullBackgroundImage(pg, pdfDoc, backgroundImageUrl);
  };

  // Titles: made a little smaller (was 16)
  ctx.writeTitle = async (title) => {
    const fs = 14;
    ctx.y -= 8;
    await ctx.need(fs + 20);
    const { bold } = pickFontsForText(title, fonts);
    const contentW = pageWidth - margin.left - margin.right;
    const text = ctx.lng === "ar" ? reText(title) : title;
    const tx =
      ctx.lng === "ar"
        ? getRTLTextX(text, fs, bold, margin.left, contentW)
        : margin.left;
    ctx.page.drawText(text, {
      x: tx,
      y: ctx.y,
      size: fs,
      font: bold,
      color: colors.heading,
    });
    ctx.y -= fs + 2;
  };

  // Unified line writer (dir + latin detection)
  ctx.writeLineAuto = async (
    t,
    fs = 11,
    isBold = false,
    color = colors.textColor,
    overrideDir = null,
    forceFont = null,
  ) => {
    const raw = String(t ?? "");
    const contentW = pageWidth - margin.left - margin.right;

    const isLatin = ASCII_RE.test(raw);
    const dir =
      overrideDir || (isLatin ? "ltr" : ctx.lng === "ar" ? "rtl" : "ltr");
    const { font, bold } = isLatin
      ? { font: fonts.enFont, bold: fonts.enBold }
      : pickFontsForText(raw, fonts);
    const useFont = forceFont ? forceFont : isBold ? bold : font;

    const shaped = dir === "rtl" ? reText(raw) : raw;
    const lines = splitTextIntoLines(shaped, contentW, useFont, fs);

    for (const line of lines) {
      await ctx.need(fs + 8);
      const tx =
        dir === "rtl"
          ? getRTLTextX(line, fs, useFont, margin.left, contentW)
          : margin.left;
      ctx.page.drawText(line, {
        x: tx,
        y: ctx.y,
        size: fs,
        font: useFont,
        color,
      });
      ctx.y -= fs + 6;
    }
  };

  // 1) Intro
  await renderIntroPage(ctx, {
    introImageUrl,
    title: lng === "ar" ? "" : "",
    fonts,
    colors,
  });

  // 2) Content
  await ctx.ensurePage();
  await renderClientSection(ctx, { lng, contract, fonts, colors });
  await renderAmountSection(ctx, { lng, contract });
  await renderDbSpecialItems(ctx, { lng, contract, fonts, colors });
  await renderPartyOneWithPayments(ctx, {
    lng,
    contract,
    fonts,
    colors,
    defaultContractUtilityData,
  });
  await renderStagesTable(ctx, {
    lng,
    contract,
    fonts,
    colors,
    defaultContractUtilityData,
  });
  await renderStageClauses(ctx, {
    lng,
    fonts,
    colors,
    defaultContractUtilityData,
  });
  await renderPartyTwoObligations(ctx, {
    lng,
    fonts,
    colors,
    defaultContractUtilityData,
  });
  await renderHandwrittenSpecialClauses(ctx, {
    lng,
    fonts,
    colors,
    defaultContractUtilityData,
  });
  await renderDrawingsSection(ctx, {
    lng,
    contract,
    defaultDrawingUrl,
    fonts,
    colors,
  });

  // 3) Confirmation + Signature ON THE SAME PAGE
  await renderConfirmationAndSignaturePage(ctx, {
    lng,
    clientName,
    signatureUrl,
    signaturePartUrl,
    fonts,
    colors,
  });

  await renderFooterPageNumbers(pdfDoc, { lng, fonts, colors, pageWidth });
  if (canceled) {
    await drawCancelledWatermarkOnAllPages(pdfDoc, {
      fonts,
      lng,

      textAr: cancelWatermarkTextAr,
      textEn: cancelWatermarkTextEn,
      color: colors.red,
      opacity: 0.14,
      angleDeg: 33,
      gap: 260,
    });
  }
  return await pdfDoc.save();
}

export async function buildAndUploadContractPdf({
  token,
  lng = "ar",
  signatureUrl,
  // defaultDrawingUrl = `${process.env.SERVER_URL}/uploads/default-drawing.jpg`,
  canceled = false,
  defaultDrawingUrl = null,
  id,
}) {
  const siteUtility = await prisma.siteUtility.findFirst();
  const backgroundImageUrl =
    siteUtility?.pdfFrame || PDF_ASSET_DEFAULTS.pdfFrame;
  const introImageUrl =
    siteUtility?.introPage || PDF_ASSET_DEFAULTS.introPage;
  const signaturePartUrl =
    siteUtility?.pdfSignaturePart || PDF_ASSET_DEFAULTS.pdfSignaturePart;
  const OR = [{ arToken: token }];
  if (id && !isNaN(Number(id))) {
    OR.push({ id: Number(id) });
  }
  const contract = await prisma.contract.findFirst({
    where: {
      OR,
    },
    include: {
      clientLead: { include: { client: true } },
      stages: {
        include: {
          project: true,
        },
      },
      paymentsNew: {
        include: {
          project: true,
          conditionItem: true,
        },
      },
      drawings: true,
      specialItems: true,
    },
  });
  if (!contract) throw new Error("Contract not found");

  const clientName = contract.clientLead?.client?.name || "";
  const clientLeadId = contract.clientLeadId;
  const defaultContractUtilityData = await getDefaultContractUtilityData();
  const arPdfBytes = await generateContractPdf({
    contract,
    lng: "ar",
    clientName,
    signatureUrl,
    signaturePartUrl,
    backgroundImageUrl,
    introImageUrl,
    defaultDrawingUrl,
    padding: { top: 72, right: 56, bottom: 72, left: 56 },
    canceled,
    defaultContractUtilityData,
  });
  const arPublicUrl = await generateContractPdfLinksInBothLanguages({
    contract,
    lng: "ar",
    pdfBytes: arPdfBytes,
  });
  const enPdfBytes = await generateContractPdf({
    contract,
    lng: "en",
    clientName,
    signatureUrl,
    signaturePartUrl,
    backgroundImageUrl,
    introImageUrl,
    defaultDrawingUrl,
    padding: { top: 72, right: 56, bottom: 72, left: 56 },
    canceled,
    defaultContractUtilityData,
  });
  const enPublicUrl = await generateContractPdfLinksInBothLanguages({
    contract,
    lng: "en",
    pdfBytes: enPdfBytes,
  });
  if (!canceled) {
    await notifyUsersThatAContractWasSigned({ clientLeadId: clientLeadId });

    await sendSuccessEmailAfterContractSigned({
      token,
      clientLeadId,
      arPdfUrl: arPublicUrl,
      enPdfUrl: enPublicUrl,
      lng,
    });
  }
  await updateContractPaymentOnContractSign({ contractId: contract.id });
  return arPublicUrl;
}

async function generateContractPdfLinksInBothLanguages({
  contract,
  lng,
  pdfBytes,
}) {
  const fileName = `contract-${contract.id}-${lng}-${uuidv4()}.pdf`;
  const remotePath = `public_html/uploads/${fileName}`;
  await uploadToFTPHttpAsBuffer(pdfBytes, remotePath, true);
  const publicUrl = `/uploads/${fileName}`;
  console.log("Generated PDF URL:", publicUrl);
  if (lng === "ar") {
    await prisma.contract.update({
      where: { id: Number(contract.id) },
      data: { pdfLinkAr: publicUrl },
    });
  } else {
    await prisma.contract.update({
      where: { id: Number(contract.id) },
      data: { pdfLinkEn: publicUrl },
    });
  }
  return publicUrl;
}
