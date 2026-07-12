import { getRTLTextX, reText, splitTextIntoLines, isArabicText, formatAED } from "../../../infra/pdf/pdf-helpers.js";
import { PAYMENT_ORDINAL } from "./witten-blocks-data.js";

export const ASCII_RE = /^[\x00-\x7F\s.,:;@!?#%&*()+\-\/\\\[\]{}"'<>=|]+$/; // latin-ish

export function widthOf(text, size, font) {
  return font.widthOfTextAtSize(String(text || ""), size);
}

export function createPdfContext({
  pdfDoc,
  pageWidth,
  pageHeight,
  margin,
  startTopOffset = 80,
  lng = "ar",
}) {
  let page = null;
  let y = 300;

  const ensurePage = async () => {
    if (!page) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      if (typeof ctx.drawBg === "function") await ctx.drawBg(page);
      y = pageHeight - margin.top - startTopOffset;
    }
  };
  const newPage = async () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    if (typeof ctx.drawBg === "function") await ctx.drawBg(page);
    y = pageHeight - margin.top - startTopOffset;
  };
  const need = async (h) => {
    if (!page) await ensurePage();
    if (y - h < margin.bottom) await newPage();
  };

  const ctx = {
    get page() {
      return page;
    },
    get y() {
      return y;
    },
    set y(v) {
      y = v;
    },
    pageWidth,
    pageHeight,
    margin,
    newPage,
    need,
    ensurePage,
    drawBg: null,
    writeTitle: null,
    writeLineAuto: null,
    lng,
  };
  return ctx;
}

// pick font per TEXT content

export function pickFontsForText(text, fonts) {
  const isAr = isArabicText(String(text || ""));
  return isAr
    ? { font: fonts.arFont, bold: fonts.arBold }
    : { font: fonts.enFont, bold: fonts.enBold };
}

export function isRTL(text) {
  return isArabicText(String(text || ""));
}

// ===== Shared render utils (subheads, lists with robust bullets) =====

export async function writeSubhead(ctx, text, { fonts, colors, fs = 12 }) {
  const t = String(text || "");
  const { bold } = pickFontsForText(t, fonts);
  await ctx.need(fs + 10);
  const shaped = ctx.lng === "ar" ? reText(t) : t;
  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const x =
    ctx.lng === "ar"
      ? getRTLTextX(shaped, fs, bold, ctx.margin.left, contentW)
      : ctx.margin.left;
  ctx.page.drawText(shaped, {
    x,
    y: ctx.y,
    size: fs,
    font: bold,
    color: colors.heading,
  });
  ctx.y -= fs + 6;
}

export async function writeBolxParagraphOrList(ctx, text, { fonts, colors, fs = 11 }) {
  const raw = String(text ?? "");
  if (!raw.trim()) return;

  const linesIn = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const isLikelyList =
    linesIn.some((ln) => /^(\u2022|•|-|–|\d+[).])\s*/.test(ln)) ||
    linesIn.length > 1;

  if (!isLikelyList) {
    const forceLatin = ASCII_RE.test(raw);
    await ctx.writeLineAuto(
      raw,
      fs,
      true,
      colors.textColor,
      forceLatin ? "ltr" : ctx.lng === "ar" ? "rtl" : null,
    );
    return;
  }

  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const indent = 14;
  const wrapW = contentW - indent;
  const bulletFS = fs;

  let isFirstBullet = true;

  for (const original of linesIn) {
    const lnText = original.replace(/^(\u2022|•|-|–|\d+[).])\s*/, "").trim();
    const isLatin = ASCII_RE.test(lnText);
    const useFontObj = isLatin
      ? { font: fonts.enFont, bold: fonts.enBold }
      : pickFontsForText(lnText, fonts);
    const useFont = useFontObj.bold;

    const rtl = !isLatin && ctx.lng === "ar";
    const shaped = rtl ? reText(lnText) : lnText;
    const wrapped = splitTextIntoLines(shaped, wrapW, useFont, fs);

    for (let i = 0; i < wrapped.length; i++) {
      const line = wrapped[i];
      await ctx.need(fs + 8);

      const bullet = "•";
      const bFont = fonts.enFont;

      // extra margin before the very first bullet in a block
      if (isFirstBullet && i === 0) {
        ctx.y -= 4;
        isFirstBullet = false;
      }

      if (rtl) {
        if (i === 0) {
          const bw = widthOf(bullet, bulletFS, bFont);
          ctx.page.drawText(bullet, {
            x: ctx.margin.left + contentW - bw,
            y: ctx.y,
            size: bulletFS,
            font: bFont,
            color: colors.textColor,
          });
        }
        const tx = getRTLTextX(
          line,
          fs,
          useFont,
          ctx.margin.left,
          contentW - indent,
        );
        ctx.page.drawText(line, {
          x: tx,
          y: ctx.y,
          size: fs,
          font: useFont,
          color: colors.textColor,
        });
      } else {
        if (i === 0) {
          ctx.page.drawText(bullet, {
            x: ctx.margin.left,
            y: ctx.y,
            size: bulletFS,
            font: bFont,
            color: colors.textColor,
          });
        }
        const tx = ctx.margin.left + indent;
        ctx.page.drawText(line, {
          x: tx,
          y: ctx.y,
          size: fs,
          font: useFont,
          color: colors.textColor,
        });
      }
      ctx.y -= fs + 6;
    }
    // extra space between bullets
    ctx.y -= 4;
  }
  ctx.y -= 2;
}
// Draw a paragraph or bullet list; bullets always in English font to avoid glyph issues

export async function writeParagraphOrList(ctx, text, { fonts, colors, fs = 11 }) {
  const raw = String(text ?? "");
  if (!raw.trim()) return;

  const linesIn = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const isLikelyList =
    linesIn.some((ln) => /^(\u2022|•|-|–|\d+[).])\s*/.test(ln)) ||
    linesIn.length > 1;

  if (!isLikelyList) {
    const forceLatin = ASCII_RE.test(raw);
    await ctx.writeLineAuto(
      raw,
      fs,
      false,
      colors.textColor,
      forceLatin ? "ltr" : ctx.lng === "ar" ? "rtl" : null,
    );
    return;
  }

  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const indent = 14;
  const wrapW = contentW - indent;
  const bulletFS = fs;

  let isFirstBullet = true;

  for (const original of linesIn) {
    const lnText = original.replace(/^(\u2022|•|-|–|\d+[).])\s*/, "").trim();
    const isLatin = ASCII_RE.test(lnText);
    const useFontObj = isLatin
      ? { font: fonts.enFont, bold: fonts.enBold }
      : pickFontsForText(lnText, fonts);
    const useFont = useFontObj.font;

    const rtl = !isLatin && ctx.lng === "ar";
    const shaped = rtl ? reText(lnText) : lnText;
    const wrapped = splitTextIntoLines(shaped, wrapW, useFont, fs);

    for (let i = 0; i < wrapped.length; i++) {
      const line = wrapped[i];
      await ctx.need(fs + 8);

      const bullet = "•";
      const bFont = fonts.enFont;

      // extra margin before the very first bullet in a block
      if (isFirstBullet && i === 0) {
        ctx.y -= 4;
        isFirstBullet = false;
      }

      if (rtl) {
        if (i === 0) {
          const bw = widthOf(bullet, bulletFS, bFont);
          ctx.page.drawText(bullet, {
            x: ctx.margin.left + contentW - bw,
            y: ctx.y,
            size: bulletFS,
            font: bFont,
            color: colors.textColor,
          });
        }
        const tx = getRTLTextX(
          line,
          fs,
          useFont,
          ctx.margin.left,
          contentW - indent,
        );
        ctx.page.drawText(line, {
          x: tx,
          y: ctx.y,
          size: fs,
          font: useFont,
          color: colors.textColor,
        });
      } else {
        if (i === 0) {
          ctx.page.drawText(bullet, {
            x: ctx.margin.left,
            y: ctx.y,
            size: bulletFS,
            font: bFont,
            color: colors.textColor,
          });
        }
        const tx = ctx.margin.left + indent;
        ctx.page.drawText(line, {
          x: tx,
          y: ctx.y,
          size: fs,
          font: useFont,
          color: colors.textColor,
        });
      }
      ctx.y -= fs + 6;
    }
    // extra space between bullets
    ctx.y -= 4;
  }
  ctx.y -= 2;
}

// ===== Section renderers =====

export function buildPaymentLine({ payment, index, lng, taxRate }) {
  const ordinal =
    PAYMENT_ORDINAL[lng][index] ||
    (lng === "ar" ? `دفعة ${index}` : `Payment ${index}`);

  const baseAmountNum = Number(payment.amount || 0);
  const rate = taxRate > 1 ? taxRate / 100 : taxRate; // expects 0.05, but handles 5 too
  const amountWithTaxNum = baseAmountNum * (1 + (rate || 0));

  const amt = formatAED(baseAmountNum, lng);
  const amtWithTax = formatAED(amountWithTaxNum, lng);

  let primary =
    lng === "ar"
      ? payment.conditionItem?.labelAr
      : payment.conditionItem?.labelEn || payment.conditionItem?.labelAr;

  const taxNote =
    lng === "ar"
      ? ` ${amtWithTax} )شامل الضريبة(`
      : ` ${amtWithTax} (VAT included)`;

  if (index === 1) {
    return lng === "ar"
      ? ` ${ordinal} عند توقيع العقد بقيمه: ${taxNote}`
      : ` ${ordinal} on contract signature: ${taxNote}`;
  }

  return lng === "ar"
    ? `- ${ordinal} ${primary}: ${taxNote}`
    : `- ${ordinal} ${primary}: ${taxNote}`;
}
