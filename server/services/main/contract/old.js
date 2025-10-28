// server/services/main/contract/generateContractPdf.js
import { PDFDocument, rgb } from "pdf-lib";
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
} from "../../utilityServices.js";
import { uploadToFTPHttpAsBuffer } from "../utility.js";
import prisma from "../../../prisma/prisma.js";
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
  defaultStageLabels,
  STAGE_PROGRESS,
  HANDWRITTEN_SPECIAL_CLAUSES,
  CONTRACT_LEVELSENUM,
  COUNTRY_LABEL,
  EMIRATE_LABEL,
  UAE_LABEL,
  STAGE_STATUS_LABEL,
  PROJECT_TYPES_LABELS,
} from "./wittenBlocksData.js";

// ===== Helpers =====
const ASCII_RE = /^[\x00-\x7F\s.,:;@!?#%&*()+\-\/\\\[\]{}"'<>=|]+$/; // latin-ish

function widthOf(text, size, font) {
  return font.widthOfTextAtSize(String(text || ""), size);
}

async function drawFullBackgroundImage(page, pdfDoc, backgroundImageUrl) {
  if (!backgroundImageUrl) return;
  try {
    const bytes = await fetchImageBuffer(backgroundImageUrl);
    let img;
    try {
      img = await pdfDoc.embedPng(bytes);
    } catch {
      img = await pdfDoc.embedJpg(bytes);
    }
    if (!img) return;
    const pw = page.getWidth();
    const ph = page.getHeight();
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
  } catch (e) {
    console.warn("Background image error:", e.message);
  }
}

function createPdfContext({
  pdfDoc,
  pageWidth,
  pageHeight,
  margin,
  startTopOffset = 56, // ⬅️ doubled from 28
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
    lng, // ⬅️ remember current language
  };
  return ctx;
}

// pick font per TEXT content
function pickFontsForText(text, fonts) {
  const isAr = isArabicText(String(text || ""));
  return isAr
    ? { font: fonts.arFont, bold: fonts.arBold }
    : { font: fonts.enFont, bold: fonts.enBold };
}
function isRTL(text) {
  return isArabicText(String(text || ""));
}

// ===== Shared render utils (subheads, lists with robust bullets) =====
async function writeSubhead(ctx, text, { fonts, colors, fs = 12 }) {
  const t = String(text || "");
  const { bold } = pickFontsForText(t, fonts);
  await ctx.need(fs + 10);
  const shaped = isRTL(t) ? reText(t) : t;
  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const rtl = ctx.lng === "ar";
  const x = rtl
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

// Draw a paragraph or bullet list; bullets always drawn with EN font to avoid glyph issues
async function writeParagraphOrList(ctx, text, { fonts, colors, fs = 11 }) {
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
    // paragraph: force RTL origin when lng=ar unless it's pure-latin
    const forceLatin = ASCII_RE.test(raw);
    await ctx.writeLineAuto(
      raw,
      fs,
      false,
      colors.textColor,
      forceLatin ? "ltr" : ctx.lng === "ar" ? "rtl" : null
    );
    return;
  }

  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const indent = 14;
  const wrapW = contentW - indent;
  const bulletFS = fs;

  for (const original of linesIn) {
    const lnText = original.replace(/^(\u2022|•|-|–|\d+[).])\s*/, "").trim();
    const isLatin = ASCII_RE.test(lnText);
    const useFontObj = isLatin
      ? { font: fonts.enFont, bold: fonts.enBold }
      : pickFontsForText(lnText, fonts);
    const useFont = useFontObj.font;

    // shape content per direction: Arabic page defaults to RTL for non-latin
    const rtl = !isLatin && ctx.lng === "ar";
    const shaped = rtl ? reText(lnText) : lnText;
    const wrapped = splitTextIntoLines(shaped, wrapW, useFont, fs);

    for (let i = 0; i < wrapped.length; i++) {
      const line = wrapped[i];
      await ctx.need(fs + 8);

      // bullet (always EN font & "•")
      const bullet = "•";
      const bFont = fonts.enFont;

      if (rtl) {
        // Draw bullet on the right, then line leftwards
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
          contentW - indent
        );
        ctx.page.drawText(line, {
          x: tx,
          y: ctx.y,
          size: fs,
          font: useFont,
          color: colors.textColor,
        });
      } else {
        // LTR bullets on the left
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
  }
  ctx.y -= 4; // small space after list
}

// ===== Section renderers =====
async function renderIntroPage(ctx, { introImageUrl, title, fonts, colors }) {
  const { pdfDoc, pageWidth, pageHeight } = ctx;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  await drawFullBackgroundImage(page, pdfDoc, introImageUrl);
  if (!title) return;
  const { bold } = pickFontsForText(title, fonts);
  const fs = 22;
  const tw = bold.widthOfTextAtSize(title, fs);
  page.drawText(isRTL(title) ? reText(title) : title, {
    x: (pageWidth - tw) / 2,
    y: pageHeight * 0.62,
    size: fs,
    font: bold,
    color: colors.primary,
  });
}

// === client section (label/value separated; values normal; Arabic page aligns right)
async function renderClientSection(ctx, { lng, contract, fonts, colors }) {
  const writeLabel = async (label, fs = 11, anotherFont) => {
    await ctx.writeLineAuto(
      String(label ?? "-"),
      fs,
      true,
      colors.textColor,
      null,
      anotherFont
    );
  };
  const writeValue = async (value, { fs = 11, anotherFont } = {}) => {
    await ctx.writeLineAuto(
      String(value ?? "-"),
      fs,
      false,
      colors.textColor,
      null,
      anotherFont
    );
  };

  await ctx.writeTitle(FIXED_TEXT.titles.partyOne[lng]);

  const owner = contract?.clientLead?.client || {};
  const lead = contract?.clientLead || {};
  const emirate = lead?.emirate || null;
  const country = lead?.country || null;

  const address = (() => {
    if (!emirate || emirate === "OUTSIDE") {
      if (country && COUNTRY_LABEL[country]) return COUNTRY_LABEL[country][lng];
      return country || (lng === "ar" ? "—" : "-");
    }
    const emirateLabel = EMIRATE_LABEL[lng]?.[emirate] || emirate;
    return `${emirateLabel} — ${UAE_LABEL[lng]}`;
  })();

  await writeLabel(lng === "ar" ? "اسم المالك" : "Owner name");
  await writeValue(owner?.name || "-");

  await writeLabel(lng === "ar" ? "العنوان" : "Address");
  await writeValue(address);

  await writeLabel(lng === "ar" ? "رقم الهاتف" : "Phone");
  await ctx.writeLineAuto(
    owner?.phone || "-",
    11,
    false,
    colors.textColor,
    "ltr",
    fonts.enFont
  );

  await writeLabel(lng === "ar" ? "البريد الإلكتروني" : "Email");
  await ctx.writeLineAuto(
    owner?.email || "-",
    11,
    false,
    colors.textColor,
    "ltr",
    fonts.enFont
  );

  const stageNums = (contract?.stages || [])
    .map((s) => Number(s.order || 0))
    .filter(Boolean)
    .sort((a, b) => a - b);

  await ctx.need(20);
  await writeLabel(FIXED_TEXT.titles.includesStages[lng]);
  await ctx.writeLineAuto(
    stageNums.length ? stageNums.join(", ") : "-",
    11,
    false,
    colors.textColor,
    "ltr",
    fonts.enFont
  );

  const today = dayjs()
    .locale(lng === "ar" ? "ar" : "en")
    .format("YYYY/MM/DD");
  await writeLabel(
    lng === "ar" ? "تاريخ كتابة العقد" : "Contract Written Date"
  );
  await ctx.writeLineAuto(
    today,
    11,
    false,
    colors.textColor,
    "ltr",
    fonts.enFont
  );
}

async function renderAmountSection(ctx, { lng, contract }) {
  const amount = Number(contract?.amount ?? 0);
  const vatRate = Number(contract?.taxRate ?? 0);
  const total = contract?.totalAmount ?? amount * (1 + vatRate / 100);

  await ctx.writeTitle(FIXED_TEXT.titles.amounts[lng]);
  if (lng === "ar") {
    await ctx.writeLineAuto(
      `اتفق الفريقان على أن تكون تكلفة التصميم الداخلي للمشروع هي: ${formatAED(
        amount,
        "ar"
      )} ${FIXED_TEXT.currencyAED[lng]}`,
      11,
      false
    );
    await ctx.writeLineAuto(
      `مع ضريبة ${vatRate || 0}% تصبح تكلفة التصميم ${formatAED(total, "ar")} ${
        FIXED_TEXT.currencyAED[lng]
      }.`,
      11,
      false
    );
  } else {
    await ctx.writeLineAuto(
      `Both parties agreed that the interior design cost is: ${formatAED(
        amount,
        "en"
      )} ${FIXED_TEXT.currencyAED[lng]}.`,
      11,
      false
    );
    await ctx.writeLineAuto(
      `With VAT ${vatRate || 0}%, the total design cost becomes ${formatAED(
        total,
        "en"
      )} ${FIXED_TEXT.currencyAED[lng]}.`,
      11,
      false
    );
  }
}

async function renderDbSpecialItems(ctx, { lng, contract, fonts, colors }) {
  const items = (contract?.specialItems || [])
    .map((it) => (lng === "ar" ? it.labelAr : it.labelEn || it.labelAr))
    .filter(Boolean);
  if (!items.length) return;
  await ctx.writeTitle(lng === "ar" ? "بنود خاصة" : "Special Terms");
  await writeParagraphOrList(ctx, items.map((t) => `• ${t}`).join("\n"), {
    fonts,
    colors,
    fs: 11,
  });
}

function buildPaymentLine({ payment, index, lng }) {
  const ordinal =
    PAYMENT_ORDINAL[lng][index] ||
    (lng === "ar" ? `دفعة ${index}` : `Payment ${index}`);
  const amt = formatAED(payment.amount, lng);
  const beforeStageText =
    payment.beforeStageOrder && lng === "ar"
      ? ` وقبل البدء بالمرحلة ${payment.beforeStageOrder}`
      : payment.beforeStageOrder && lng === "en"
      ? ` and before starting stage ${payment.beforeStageOrder}`
      : "";
  const primary = PROJECT_TYPES_LABELS[payment?.project?.type]?.[lng] || "";
  if (index === 1) {
    return lng === "ar"
      ? `• ${ordinal} عند توقيع العقد بقيمه: ${amt}`
      : `• ${ordinal} on contract signature: ${amt}`;
  }
  return lng === "ar"
    ? `• ${ordinal} الانتهاء من ${primary}${beforeStageText} بقيمة : ${amt}`
    : `• ${ordinal} upon completion of ${primary}${beforeStageText}: ${amt}`;
}

async function renderPartyOneWithPayments(
  ctx,
  { lng, contract, fonts, colors }
) {
  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الأول" : "Party One Obligations"
  );

  // Render Party One obligations as a list (each item alone)
  const base = OBLIGATIONS_TEXT.partyOne[lng].base || "";
  const items = base
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((ln) => !/^الت.*زامات|Obligations/i.test(ln));
  await writeParagraphOrList(
    ctx,
    items
      .map((t) => (t.match(/^(\u2022|•|-|–|\d+[).])/) ? t : `• ${t}`))
      .join("\n"),
    {
      fonts,
      colors,
      fs: 11,
    }
  );

  const payments = contract?.paymentsNew || contract?.payments || [];
  if (payments.length) {
    await writeSubhead(
      ctx,
      lng === "ar" ? "جدول الدفعات" : "Payment schedule",
      { fonts, colors, fs: 12 }
    );
    const paymentLines = payments.map((p, i) =>
      buildPaymentLine({ payment: p, index: i + 1, lng })
    );
    await writeParagraphOrList(ctx, paymentLines.join("\n"), {
      fonts,
      colors,
      fs: 11,
    });
  }
}

// ===== Redesigned Stages “Cards”
async function renderStagesCards(ctx, { lng, contract, fonts, colors }) {
  await ctx.writeTitle(FIXED_TEXT.titles.allStagesMatrix[lng]);

  const baseStages = CONTRACT_LEVELSENUM.map((s, i) => ({
    key: s.enum,
    order: i + 1,
    label:
      (lng === "ar" ? s.labelAr : s.labelEn) || s.label || `Stage ${i + 1}`,
  }));

  const stagesMap = new Map();
  (contract?.stages || []).forEach((st) => {
    const k = st.order || 0;
    stagesMap.set(k, st);
  });

  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;

  for (const s of baseStages) {
    const included = stagesMap.has(s.order);
    const data = stagesMap.get(s.order) || {};
    const statusKey = data?.stageStatus || "NOT_STARTED";
    const statusLabel = STAGE_STATUS_LABEL?.[lng]?.[statusKey] || statusKey;
    const deliveryDays = data?.deliveryDays;

    const pad = 12;
    const headerH = 22;
    const borderW = 0.8;
    const maxTextW = contentW - pad * 2;

    const titleLine = `${s.order}. ${s.label}`;
    const { bold: titleFont } = pickFontsForText(titleLine, fonts);

    const details = (STAGE_PROGRESS[s.order]?.[lng] || []).map((t) => `• ${t}`);
    if (data?.notes) details.push(String(data.notes));

    let detailsHeight = 0;
    for (const t of details) {
      const { font } = pickFontsForText(t, fonts);
      const lines = splitTextIntoLines(
        isRTL(t) ? reText(t) : t,
        maxTextW,
        font,
        11
      );
      detailsHeight += lines.length * (11 + 2);
    }

    const infoLine =
      included && deliveryDays != null
        ? lng === "ar"
          ? `أيام التسليم: ${deliveryDays} يوم`
          : `Delivery days: ${deliveryDays}`
        : lng === "ar"
        ? "غير محدد"
        : "Not specified";

    const bodyBlocks = detailsHeight + 14 + 8;
    const cardH = headerH + bodyBlocks + 4;

    await ctx.need(cardH + pad * 2 + borderW * 2);

    const x = ctx.margin.left;
    const yTop = ctx.y;
    const boxH = cardH + pad * 2;

    // Body
    ctx.page.drawRectangle({
      x,
      y: yTop - boxH,
      width: contentW,
      height: boxH,
      color: colors.accentBg,
      borderColor: colors.borderColor,
      borderWidth: borderW,
    });

    // Header bar
    const headerY = yTop - pad - headerH;
    ctx.page.drawRectangle({
      x: x,
      y: headerY,
      width: contentW,
      height: headerH,
      color: colors.bgPrimary,
    });

    // Header title
    {
      const titleText = isRTL(titleLine) ? reText(titleLine) : titleLine;
      const tx =
        ctx.lng === "ar"
          ? getRTLTextX(titleText, 12, titleFont, x + pad, contentW - pad * 2)
          : x + pad;
      ctx.page.drawText(titleText, {
        x: tx,
        y: headerY + (headerH - 12) / 2 + 2,
        size: 12,
        font: titleFont,
        color: colors.heading,
      });
    }

    // Included & Status row
    let y = headerY - 10;
    {
      const includedLabel = included
        ? lng === "ar"
          ? "يشمل العقد"
          : "Included"
        : lng === "ar"
        ? "لا يشمل"
        : "Not included";
      const leftLine = (lng === "ar" ? "الحالة: " : "Status: ") + statusLabel;
      const rightLine = (lng === "ar" ? "الشمول: " : "Scope: ") + includedLabel;

      // left
      const { font: lf } = pickFontsForText(leftLine, fonts);
      const lt = ctx.lng === "ar" ? reText(leftLine) : leftLine;
      const ltx =
        ctx.lng === "ar"
          ? getRTLTextX(lt, 11, lf, x + pad, contentW / 2 - pad)
          : x + pad;
      ctx.page.drawText(lt, {
        x: ltx,
        y,
        size: 11,
        font: lf,
        color: colors.textColor,
      });

      // right
      const { font: rf } = pickFontsForText(rightLine, fonts);
      const rt = ctx.lng === "ar" ? reText(rightLine) : rightLine;
      const rtw = widthOf(rt, 11, rf);
      const rtx = ctx.lng === "ar" ? x + pad : x + contentW - pad - rtw;
      ctx.page.drawText(rt, {
        x: rtx,
        y,
        size: 11,
        font: rf,
        color: colors.textColor,
      });
    }

    y -= 14;

    // Delivery days
    {
      const t = String(infoLine || "");
      const { font } = pickFontsForText(t, fonts);
      const shaped = ctx.lng === "ar" ? reText(t) : t;
      const tx =
        ctx.lng === "ar"
          ? getRTLTextX(shaped, 11, font, x + pad, contentW - pad * 2)
          : x + pad;
      ctx.page.drawText(shaped, {
        x: tx,
        y,
        size: 11,
        font,
        color: colors.textColor,
      });
      y -= 12;
    }

    // Details (as bullets with EN bullet glyph)
    for (const t of details) {
      const isLatin = ASCII_RE.test(t.replace(/^(\u2022|•|-|–)\s*/, ""));
      const { font } = isLatin
        ? { font: fonts.enFont }
        : pickFontsForText(t, fonts);
      const rtl = !isLatin && ctx.lng === "ar";
      const shaped = rtl ? reText(t) : t;
      const lines = splitTextIntoLines(shaped, maxTextW, font, 11);

      for (let i = 0; i < lines.length; i++) {
        const ln = lines[i];
        const bullet = "•";
        const bFont = fonts.enFont;

        if (rtl) {
          if (i === 0) {
            const bw = widthOf(bullet, 11, bFont);
            ctx.page.drawText(bullet, {
              x: x + contentW - 12 - bw,
              y,
              size: 11,
              font: bFont,
              color: colors.textColor,
            });
          }
          const tx = getRTLTextX(
            ln,
            11,
            font,
            x + pad,
            contentW - pad * 2 - 14
          );
          ctx.page.drawText(ln, {
            x: tx,
            y,
            size: 11,
            font,
            color: colors.textColor,
          });
        } else {
          if (i === 0) {
            ctx.page.drawText(bullet, {
              x: x + pad,
              y,
              size: 11,
              font: bFont,
              color: colors.textColor,
            });
          }
          ctx.page.drawText(ln, {
            x: x + pad + 14,
            y,
            size: 11,
            font,
            color: colors.textColor,
          });
        }
        y -= 13;
      }
    }

    ctx.y = y - 10;
  }
}

async function renderStageClauses(ctx, { lng, fonts, colors }) {
  await ctx.writeTitle(lng === "ar" ? "بنود المراحل" : "Stage Clauses");
  for (const i of [1, 2, 3, 4, 5, 6]) {
    const text = STAGE_CLAUSES_DEFAULT?.[i]?.[lng];
    if (!text) continue;
    const head = lng === "ar" ? `بنود المرحلة ${i}` : `Stage ${i} Terms`;
    await writeSubhead(ctx, head, { fonts, colors, fs: 12 });
    await writeParagraphOrList(ctx, text, { fonts, colors, fs: 11 });
    ctx.y -= 2;
  }
}

async function renderPartyTwoObligations(ctx, { lng, fonts, colors }) {
  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الثاني" : "Party Two Obligations"
  );
  const text = OBLIGATIONS_TEXT.partyTwo[lng] || "";
  await writeParagraphOrList(ctx, text, { fonts, colors, fs: 11 });
}

async function renderHandwrittenSpecialClauses(ctx, { lng, fonts, colors }) {
  const items = HANDWRITTEN_SPECIAL_CLAUSES?.[lng] || [];
  if (!items.length) return;
  await ctx.writeTitle(
    lng === "ar" ? "بنود خاصة (مكتوبة بخط اليد)" : "Special Handwritten Terms"
  );
  await writeParagraphOrList(ctx, items.map((t) => `• ${t}`).join("\n"), {
    fonts,
    colors,
    fs: 11,
  });
}

async function renderDrawingsSection(
  ctx,
  { lng, contract, defaultDrawingUrl, fonts, colors }
) {
  await ctx.writeTitle(FIXED_TEXT.titles.drawings[lng]);
  const drawings = contract?.drawings || [];
  const toRender = drawings.length
    ? drawings.map((d) => d.url)
    : defaultDrawingUrl
    ? [defaultDrawingUrl]
    : [];

  const maxW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const maxH = 260;

  for (const rawUrl of toRender) {
    try {
      const bytes = await fetchImageBuffer(rawUrl);
      let img;
      try {
        img = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        img = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (!img) continue;

      let { width: sw, height: sh } = img.size();
      let W = sw,
        H = sh;
      const r = Math.min(maxW / W, maxH / H, 1);
      W *= r;
      H *= r;

      await ctx.need(H + 28);
      ctx.page.drawImage(img, {
        x: ctx.margin.left,
        y: ctx.y - H,
        width: W,
        height: H,
      });
      ctx.y -= H + 16;
    } catch {
      await ctx.writeLineAuto(rawUrl, 10, false, colors.red);
    }
  }
}

// NEW: Confirmation + Signature on the SAME PAGE
async function renderConfirmationAndSignaturePage(
  ctx,
  { lng, clientName, signatureUrl, fonts, colors }
) {
  await ctx.newPage();

  // Confirmation
  await ctx.writeTitle(FIXED_TEXT.titles.confirmation[lng]);
  await ctx.writeLineAuto(
    FIXED_TEXT.confirmationLabel[lng] ||
      (lng === "ar"
        ? "أقرّ بأنني قرأت جميع البنود وأوافق عليها"
        : "I confirm that I have read and agree to all terms"),
    12,
    false,
    colors.textColor
  );

  ctx.y -= 12;

  // Signature block (two columns)
  const fsTitle = 14;
  const colGap = 24;
  const colW =
    (ctx.pageWidth - ctx.margin.left - ctx.margin.right - colGap) / 2;
  const leftX = ctx.margin.left;
  const rightX = ctx.margin.left + colW + colGap;
  let leftY = ctx.y;
  let rightY = ctx.y;

  const secondParty = lng === "ar" ? "الفـــــريق الـــــثاني" : "Second Party";
  const firstParty = lng === "ar" ? "الفـــــريـــــق الأول" : "First Party";
  const dirLabel = lng === "ar" ? "المدير التنفيذي:" : "Executive Director:";
  const dirName = lng === "ar" ? "راشد بني عوده" : "Rashid Bni Ouda";
  const sigLabel = lng === "ar" ? "التوقيع:" : "Signature:";
  const nameLbl = lng === "ar" ? "الاسم:" : "Name:";

  // Left: Second Party
  {
    const { bold } = pickFontsForText(secondParty, fonts);
    const t = ctx.lng === "ar" ? reText(secondParty) : secondParty;
    ctx.page.drawText(t, {
      x: leftX,
      y: leftY,
      size: fsTitle,
      font: bold,
      color: colors.heading,
    });
    leftY -= fsTitle + 8;
  }
  {
    const { font } = pickFontsForText(dirLabel, fonts);
    const t = ctx.lng === "ar" ? reText(dirLabel) : dirLabel;
    ctx.page.drawText(t, {
      x: leftX,
      y: leftY,
      size: 11,
      font,
      color: colors.textColor,
    });
    leftY -= 14;
  }
  {
    const { font } = pickFontsForText(dirName, fonts);
    const t = ctx.lng === "ar" ? reText(dirName) : dirName;
    ctx.page.drawText(t, {
      x: leftX,
      y: leftY,
      size: 11,
      font,
      color: colors.textColor,
    });
    leftY -= 22;
  }

  // Stamp
  try {
    const stampBytes = await fetchImageBuffer(
      "https://dreamstudiio.com/dream-signature.png"
    );
    let stamp;
    try {
      stamp = await ctx.pdfDoc.embedPng(stampBytes);
    } catch {
      stamp = await ctx.pdfDoc.embedJpg(stampBytes);
    }
    if (stamp) {
      const scale = 0.22;
      ctx.page.drawImage(stamp, {
        x: leftX,
        y: leftY - stamp.size().height * scale - 6,
        width: stamp.size().width * scale,
        height: stamp.size().height * scale,
      });
      leftY -= stamp.size().height * scale + 28;
    }
  } catch {}

  // Right: First Party (client)
  {
    const { bold } = pickFontsForText(firstParty, fonts);
    const t = ctx.lng === "ar" ? reText(firstParty) : firstParty;
    ctx.page.drawText(t, {
      x: rightX,
      y: rightY,
      size: fsTitle,
      font: bold,
      color: colors.heading,
    });
    rightY -= fsTitle + 8;
  }
  {
    const { font } = pickFontsForText(nameLbl, fonts);
    const t = ctx.lng === "ar" ? reText(nameLbl) : nameLbl;
    ctx.page.drawText(t, {
      x: rightX,
      y: rightY,
      size: 11,
      font,
      color: colors.textColor,
    });
    rightY -= 14;
  }

  // client name lines
  {
    const nm = String(clientName || "");
    const { font } = pickFontsForText(nm, fonts);
    const lines = splitTextIntoLines(
      ctx.lng === "ar" ? reText(nm) : nm,
      colW - 10,
      font,
      11
    );
    for (const L of lines) {
      ctx.page.drawText(ctx.lng === "ar" ? reText(L) : L, {
        x: rightX,
        y: rightY,
        size: 11,
        font,
        color: colors.textColor,
      });
      rightY -= 13;
    }
    rightY -= 6;
  }

  // signature image
  if (signatureUrl) {
    try {
      const bytes = await fetchImageBuffer(signatureUrl);
      let sig;
      try {
        sig = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        sig = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (sig) {
        const maxW = colW - 10,
          maxH = 150;
        let { width: sw, height: sh } = sig.size();
        let W = sw,
          H = sh;
        const r = Math.min(maxW / W, maxH / H, 1);
        W *= r;
        H *= r;
        const { font } = pickFontsForText(sigLabel, fonts);
        const t = ctx.lng === "ar" ? reText(sigLabel) : sigLabel;
        ctx.page.drawText(t, {
          x: rightX,
          y: rightY - H / 2 + 4,
          size: 11,
          font,
          color: colors.textColor,
        });
        ctx.page.drawImage(sig, {
          x: rightX + 55,
          y: rightY - H,
          width: W,
          height: H,
        });
        rightY -= H + 18;
      }
    } catch {
      await ctx.writeLineAuto(
        lng === "ar"
          ? "ملاحظة: لم يتم تحميل صورة التوقيع."
          : "Note: Signature image could not be loaded.",
        11,
        false,
        colors.red
      );
    }
  }
}

async function renderFooterPageNumbers(
  pdfDoc,
  { lng, fonts, colors, pageWidth }
) {
  const total = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  dayjs.locale(lng === "ar" ? "ar" : "en");

  for (let i = 0; i < total; i++) {
    const pg = pages[i];
    const fs = 10;
    const dateText =
      (lng === "ar" ? "تاريخ الإنشاء: " : "Generated: ") +
      dayjs().format("MMMM D, YYYY");
    const pageText =
      lng === "ar"
        ? `الصفحة ${i + 1} من ${total}`
        : `Page ${i + 1} of ${total}`;

    const { font: dateFont } = pickFontsForText(dateText, fonts);
    const { font: pageFont } = pickFontsForText(pageText, fonts);

    const dtw = dateFont.widthOfTextAtSize(dateText, fs);
    const ptw = pageFont.widthOfTextAtSize(pageText, fs);

    pg.drawText(isRTL(dateText) ? reText(dateText) : dateText, {
      x: lng === "ar" ? pageWidth - dtw - 18 : 18,
      y: 24,
      size: fs,
      font: dateFont,
      color: colors.textColor,
    });
    pg.drawText(isRTL(pageText) ? reText(pageText) : pageText, {
      x: lng === "ar" ? 18 : pageWidth - ptw - 18,
      y: 24,
      size: fs,
      font: pageFont,
      color: colors.textColor,
    });
  }
}

// ===== Public API =====
export async function generateContractPdf({
  contract,
  lng = "ar",
  clientName,
  signatureUrl,
  backgroundImageUrl,
  introImageUrl,
  // layout
  pageWidth = 600,
  pageHeight = 800,
  padding = { top: 72, right: 56, bottom: 72, left: 56 },
  defaultDrawingUrl = null,
}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const arFont = await pdfDoc.embedFont(fontBase64);
  const arBold = await pdfDoc.embedFont(fontBoldBase64);
  const enFont = await pdfDoc.embedFont(enfontBase64);
  const enBold = await pdfDoc.embedFont(enfontBoldBase64);
  const fonts = { arFont, arBold, enFont, enBold };

  // Your palette
  const colors = {
    primary: rgb(0.827, 0.675, 0.443),
    primaryDark: rgb(0.745, 0.592, 0.361),
    primaryLight: rgb(0.95, 0.92, 0.88),
    heading: rgb(0.22, 0.188, 0.157),
    textColor: rgb(0.345, 0.302, 0.247),
    bgPrimary: rgb(0.918, 0.906, 0.886),
    accentBg: rgb(0.98, 0.97, 0.95),
    success: rgb(0.518, 0.569, 0.471),
    borderColor: rgb(0.7, 0.7, 0.7),
    white: rgb(1, 1, 1),
    lightGray: rgb(0.95, 0.95, 0.95),
    shadowColor: rgb(0.85, 0.85, 0.85),
    red: rgb(1, 0, 0),
  };

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
    startTopOffset: 56, // ⬅️ doubled for all pages
    lng,
  });
  ctx.pdfDoc = pdfDoc;
  ctx.drawBg = async (pg) => {
    await drawFullBackgroundImage(pg, pdfDoc, backgroundImageUrl);
  };

  // Titles bold; body normal. Respect Arabic page RTL by default.
  ctx.writeTitle = async (title) => {
    const fs = 16;
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
    ctx.y -= fs + 12;
  };

  /**
   * Unified line writer with:
   * - auto English-only detection -> force LTR + enFont
   * - otherwise: if lng === 'ar' -> RTL origin, else LTR
   * - optional overrideDir ('rtl'|'ltr'|null)
   * - optional forceFont
   */
  ctx.writeLineAuto = async (
    t,
    fs = 11,
    isBold = false,
    color = colors.textColor,
    overrideDir = null,
    forceFont = null
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
    title: lng === "ar" ? "اتفاقية تصميم داخلي" : "Interior Design Agreement",
    fonts,
    colors,
  });

  // 2) Content
  await ctx.ensurePage();
  await renderClientSection(ctx, { lng, contract, fonts, colors });
  await renderAmountSection(ctx, { lng, contract });
  await renderDbSpecialItems(ctx, { lng, contract, fonts, colors });
  await renderPartyOneWithPayments(ctx, { lng, contract, fonts, colors });
  await renderStagesCards(ctx, { lng, contract, fonts, colors });
  await renderStageClauses(ctx, { lng, fonts, colors });
  await renderPartyTwoObligations(ctx, { lng, fonts, colors });
  await renderHandwrittenSpecialClauses(ctx, { lng, fonts, colors });
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
    fonts,
    colors,
  });

  // 4) Footer
  await renderFooterPageNumbers(pdfDoc, { lng, fonts, colors, pageWidth });

  return await pdfDoc.save();
}

export async function buildAndUploadContractPdf({
  token,
  lng = "ar",
  signatureUrl,
  defaultDrawingUrl = null,
}) {
  const siteUtility = await prisma.siteUtility.findFirst();
  const backgroundImageUrl = siteUtility?.pdfFrame || null;
  const introImageUrl = siteUtility?.introPage || null;

  const contract = await prisma.contract.findUnique({
    where: { arToken: token },
    include: {
      clientLead: { include: { client: true } },
      stages: true,
      paymentsNew: true,
      drawings: true,
      specialItems: true,
    },
  });
  if (!contract) throw new Error("Contract not found");

  const clientName = contract?.clientLead?.client?.name || "";

  const pdfBytes = await generateContractPdf({
    contract,
    lng,
    clientName,
    signatureUrl,
    backgroundImageUrl,
    introImageUrl,
    defaultDrawingUrl,
    padding: { top: 72, right: 56, bottom: 72, left: 56 },
  });

  const fileName = `contract-${contract.id}-${lng}-${uuidv4()}.pdf`;
  const remotePath = `public_html/uploads/${fileName}`;
  await uploadToFTPHttpAsBuffer(pdfBytes, remotePath, true);
  const publicUrl = `https://panel.dreamstudiio.com/uploads/${fileName}`;

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

export async function buildAndUploadContractPdfBoth({
  token,
  signatureUrl,
  defaultDrawingUrl = null,
}) {
  const ar = await buildAndUploadContractPdf({
    token,
    lng: "ar",
    signatureUrl,
    defaultDrawingUrl,
  });
  const en = await buildAndUploadContractPdf({
    token,
    lng: "en",
    signatureUrl,
    defaultDrawingUrl,
  });
  return { ar, en };
}
