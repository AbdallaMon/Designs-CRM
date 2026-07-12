import { pickFontsForText, isRTL } from "../contract-pdf-context.js";
import { reText } from "../../../../infra/pdf/pdf-helpers.js";
import { drawFullBackgroundImage } from "../../../../infra/pdf/pdf-draw.js";

export async function renderIntroPage(ctx, { introImageUrl, title, fonts, colors }) {
  const { pdfDoc, pageWidth, pageHeight } = ctx;
  console.log("introImageUrl", introImageUrl);
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  await drawFullBackgroundImage(page, pdfDoc, introImageUrl);
  if (!title) return;
  const { bold } = pickFontsForText(title, fonts);
  const fs = 16;
  const tw = bold.widthOfTextAtSize(title, fs);
  page.drawText(isRTL(title) ? reText(title) : title, {
    x: (pageWidth - tw) / 2,
    y: pageHeight * 0.62,
    size: fs,
    font: bold,
    color: colors.primary,
  });
}
