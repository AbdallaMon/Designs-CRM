import { pickFontsForText, isRTL } from "../contract-pdf-context.js";
import { reText } from "../../../../infra/pdf/pdf-helpers.js";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import dayjs from "dayjs";

export async function renderFooterPageNumbers(
  pdfDoc,
  { lng, fonts, colors, pageWidth },
) {
  const total = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  dayjs.locale(lng === "ar" ? "ar" : "en");

  // Exclude intro page from count and numbering
  for (let i = 0; i < total; i++) {
    if (i === 0) continue;

    const pg = pages[i];
    const fs = 10;
    const dateText = dayjs().format("MMMM D, 2025");
    const pageText = i.toString();
    const dateFont = fonts.enFont;
    const { font: pageFont } = pickFontsForText(pageText, fonts);

    const dtw = dateFont.widthOfTextAtSize(dateText, fs);
    const ptw = pageFont.widthOfTextAtSize(pageText, fs);

    // Push lower
    const bottomY = 14;
    const pageTextY = 39;

    // pg.drawText(dateText, {
    //   x: 18,
    //   y: bottomY,
    //   size: fs,
    //   font: dateFont,
    //   color: colors.textColor,
    // });
    pg.drawText(isRTL(pageText) ? reText(pageText) : pageText, {
      x: Math.round((pageWidth - ptw) / 2),
      y: pageTextY,
      size: 12,
      font: pageFont,
      color: colors.white,
    });
  }
}
// Call exactly like before:
// await drawCancelledWatermarkOnAllPages(pdfDoc, { fonts, lng, opacity: 0.14 })
// import { PDFDocument, rgb, degrees } from "pdf-lib";
