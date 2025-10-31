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
  formatNumber,
  formatDate,
  reverseString,
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
  STAGE_PROGRESS,
  HANDWRITTEN_SPECIAL_CLAUSES,
  CONTRACT_LEVELSENUM,
  COUNTRY_LABEL,
  EMIRATE_LABEL,
  UAE_LABEL,
  STAGE_STATUS_LABEL,
  PROJECT_TYPES_LABELS,
} from "./wittenBlocksData.js";
import { notifyUsersThatAContractWasSigned } from "../../telegram/telegram-functions.js";
import { sendSuccessEmailAfterContractSigned } from "./pdf-utilities.js";
import { updateContractPaymentOnContractSign } from "./contractServices.js";

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

// Draw a paragraph or bullet list; bullets always in English font to avoid glyph issues
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
async function renderIntroPage(ctx, { introImageUrl, title, fonts, colors }) {
  const { pdfDoc, pageWidth, pageHeight } = ctx;
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

async function renderClientSection(ctx, { lng, contract, fonts, colors }) {
  await ctx.writeTitle(FIXED_TEXT.titles.partyOne[lng]);

  const owner = contract?.clientLead?.client || {};
  const lead = contract?.clientLead || {};
  const emirate = lead?.emirate || null;
  const country = lead?.country || null;
  const code = lead?.code || lead?.id || null;
  const projectType =
    lng === "ar" ? contract.title : contract.enTitle || contract.title;

  const address = (() => {
    if (!emirate || emirate === "OUTSIDE") {
      if (country && COUNTRY_LABEL[country]) return COUNTRY_LABEL[country][lng];
      return country || (lng === "ar" ? "—" : "-");
    }
    const emirateLabel = EMIRATE_LABEL[lng]?.[emirate] || emirate;
    return `${emirateLabel} — ${UAE_LABEL[lng]}`;
  })();

  const stageNums = (contract?.stages || [])
    .map((s) => Number(s.order || 0))
    .filter(Boolean)
    .sort((a, b) => a - b);

  const today = dayjs()
    .locale(lng === "ar" ? "ar" : "en")
    .format("YYYY/MM/DD");

  // Prepare items (label/value)
  const items = [
    [lng === "ar" ? "اسم المالك" : "Owner name", String(owner?.name || "-")],
    [lng === "ar" ? "العنوان" : "Address", String(address || "-")],
    [lng === "ar" ? "رقم الهاتف" : "Phone", String(owner?.phone || "-")],
    [lng === "ar" ? "البريد الإلكتروني" : "Email", String(owner?.email || "-")],
    [lng === "ar" ? "نوع المشروع" : "Project Type", String(projectType || "-")],
    [
      lng === "ar" ? "كود المشروع" : "Project Code",
      lng === "ar" ? reverseString(String(code || "-")) : String(code || "-"),
    ],
    [
      FIXED_TEXT.titles.includesStages[lng],
      stageNums.length ? stageNums.join(", ") : "-",
    ],
    [
      lng === "ar" ? "تاريخ كتابة العقد" : "Contract Written Date",
      String(today),
    ],
  ];

  // Layout
  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const gutter = 10;
  const colW = (contentW - gutter) / 2;

  // Tighter sizing
  const padTop = 6; // keep top padding
  const padBottom = 2; // smaller bottom padding to reduce space to next item
  const labelFS = 11;
  const valueFS = 11;
  const valueTopGap = 10; // keep label→value spacing
  const rowGap = 2; // no extra gap between rows
  const LINE_LEADING = 2;
  const SHRINK = 4; // small overlap to tighten stacked rows

  // Helper: render one cell and return its height
  const renderCell = (x, yTop, label, value, alignRight) => {
    const { bold: labelFont } = pickFontsForText(label, fonts);

    // Use Latin font for phone/email/ASCII
    const valueIsLatin =
      /phone|email/i.test(label) ||
      label.includes("الهاتف") ||
      label.includes("البريد") ||
      ASCII_RE.test(String(value || ""));

    const vFont = valueIsLatin
      ? fonts.enFont
      : pickFontsForText(value, fonts).font;

    // Shape Arabic only
    const shapeIfAr = (t) =>
      ASCII_RE.test(String(t || ""))
        ? String(t || "")
        : reText(String(t || ""));

    const shapedLabel = shapeIfAr(label);
    const valueText = String(value || "");
    const shapedValue = ASCII_RE.test(valueText)
      ? valueText
      : reText(valueText);

    const maxTextW = colW - padTop * 2;

    // Wrap value
    const valueLines = splitTextIntoLines(
      shapedValue,
      maxTextW,
      vFont,
      valueFS
    );

    // Heights with asymmetric padding
    const labelH = labelFS + 1;
    const valueH = valueLines.length * (valueFS + LINE_LEADING);
    const boxH = padTop + labelH + valueTopGap + valueH + padBottom;

    // Label X (respect RTL for Arabic)
    const labelX = alignRight
      ? getRTLTextX(shapedLabel, labelFS, labelFont, x + padTop, maxTextW)
      : x + padTop;

    ctx.page.drawText(shapedLabel, {
      x: labelX,
      y: yTop - labelFS,
      size: labelFS,
      font: labelFont,
      color: colors.heading,
    });

    // Value lines (same side as label)
    let vy = yTop - padTop - labelH - valueTopGap;
    for (const line of valueLines) {
      const lineX = alignRight
        ? getRTLTextX(line, valueFS, vFont, x + padTop, maxTextW)
        : x + padTop;

      ctx.page.drawText(line, {
        x: lineX,
        y: vy,
        size: valueFS,
        font: vFont,
        color: colors.textColor,
      });
      vy -= valueFS + LINE_LEADING;
    }

    return boxH;
  };

  // Two columns (fill order depends on language)
  let i = 0;
  while (i < items.length) {
    await ctx.need(50);
    const xLeft = ctx.margin.left;
    const xRight = ctx.margin.left + colW + gutter;
    const yTop = ctx.y;

    const alignRight = lng === "ar"; // AR aligns to the right and fills right column first

    // Which side gets the first item of the pair
    const primaryX = alignRight ? xRight : xLeft;
    const secondaryX = alignRight ? xLeft : xRight;

    // First item
    const [l1, v1] = items[i] || ["", ""];
    const h1 = renderCell(primaryX, yTop, l1, v1, alignRight);

    // Optional second item
    let h2 = 0;
    if (i + 1 < items.length) {
      const [l2, v2] = items[i + 1];
      h2 = renderCell(secondaryX, yTop, l2, v2, alignRight);
    }

    // Tighter row height
    const rowH = Math.max(h1 - SHRINK, h2 - SHRINK);
    ctx.y = yTop - rowH - rowGap;

    i += 2;
  }
}

async function renderAmountSection(ctx, { lng, contract }) {
  const amount = Number(contract?.amount ?? 0);
  const vatRate = Number(contract?.taxRate ?? 0);
  const total = contract?.totalAmount ?? amount * (1 + vatRate / 100);

  await ctx.writeTitle(FIXED_TEXT.titles.amounts[lng]);
  if (lng === "ar") {
    await ctx.writeLineAuto(
      `اتفق الفريقان علي أن تكون تكلفة التصميم الداخلي للمشروع هي: ${formatAED(
        amount,
        "ar"
      )}`,
      11,
      false
    );
    await ctx.writeLineAuto(
      `مع ضريبة ${vatRate || 0}% تصبح تكلفة التصميم ${formatAED(
        total,
        "ar"
      )} .`,
      11,
      false
    );
  } else {
    await ctx.writeLineAuto(
      `Both parties agreed that the interior design cost is: ${formatAED(
        amount,
        "en"
      )}.`,
      11,
      false
    );
    await ctx.writeLineAuto(
      `With VAT ${vatRate || 0}%, the total design cost becomes ${formatAED(
        total,
        "en"
      )}.`,
      11,
      false
    );
  }
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
      ? ` ${ordinal} عند توقيع العقد بقيمه: ${amt}`
      : ` ${ordinal} on contract signature: ${amt}`;
  }
  return lng === "ar"
    ? `- ${ordinal} الانتهاء من ${primary}${beforeStageText} بقيمة : ${amt}`
    : `- ${ordinal} upon completion of ${primary}${beforeStageText}: ${amt}`;
}

async function renderDbSpecialItems(ctx, { lng, contract, fonts, colors }) {
  const items = (contract?.specialItems || [])
    .map((it) => (lng === "ar" ? it.labelAr : it.labelEn || it.labelAr))
    .filter(Boolean);
  if (!items.length) return;
  await ctx.writeTitle(lng === "ar" ? "بنود خاصة" : "Special Terms");
  await writeParagraphOrList(ctx, items.map((t) => `${t}`).join("\n"), {
    fonts,
    colors,
    fs: 11,
  });
}

async function renderPartyOneWithPayments(
  ctx,
  { lng, contract, fonts, colors }
) {
  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الأول" : "Party One Obligations"
  );

  const base = OBLIGATIONS_TEXT.partyOne[lng].base || "";
  const items = base
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((ln) => !/^الت.*زامات|Obligations/i.test(ln));
  await writeParagraphOrList(
    ctx,
    items
      .map((t) => (t.match(/^(\u2022|•|-|–|\d+[).])/) ? t : `${t}`))
      .join("\n"),
    { fonts, colors, fs: 11 }
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

    const details = (STAGE_PROGRESS[s.order]?.[lng] || []).map((t) => `${t}`);
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
      detailsHeight += lines.length * (11 + 2) + 4;
    }

    const infoLine =
      included && deliveryDays != null
        ? lng === "ar"
          ? `أيام التسليم: ${formatNumber(deliveryDays, "ar")} يوم`
          : `Delivery days: ${formatNumber(deliveryDays, lng)}`
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
      const titleText = ctx.lng === "ar" ? reText(titleLine) : titleLine;
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

    // Details (bullets) — add extra margin before first bullet
    let firstBulletOfThisCard = true;

    for (const t of details) {
      const isLatin = ASCII_RE.test(t.replace(/^(\u2022|•|-|–)\s*/, ""));
      const { font } = isLatin
        ? { font: fonts.enFont }
        : pickFontsForText(t, fonts);
      const rtl = !isLatin && ctx.lng === "ar";
      const shaped = rtl ? reText(t) : t;
      const lines = splitTextIntoLines(shaped, maxTextW, font, 11);

      // top margin before first bullet item
      if (firstBulletOfThisCard) {
        y -= 6;
        firstBulletOfThisCard = false;
      }

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
      // extra space after each bullet item
      y -= 4;
    }

    ctx.y = y - 10;
  }
}

async function renderStagesTable(ctx, { lng, contract, fonts, colors }) {
  // ===== Data =====
  const allStages = CONTRACT_LEVELSENUM.map((s, i) => ({
    order: i + 1,
    label:
      (lng === "ar" ? s.labelAr : s.labelEn) || s.label || `Stage ${i + 1}`,
  })).slice(0, 7);

  const stagesMain = allStages.slice(0, 6); // first six in the main row
  let stageLast;
  // const stageLast = allStages[6] || null; // seventh in its own full-width row

  const stagesMap = new Map();
  (contract?.stages || []).forEach((st) => {
    const k = st.order || 0;
    stagesMap.set(k, st);
  });

  const rtl = lng === "ar";

  // ===== Layout tuning (EDIT THESE FIRST) =====
  const WIDTH_BOOST = 18; // increase for wider columns
  const colGapX = 6; // gap between main 6 columns
  const pad = 8; // general padding
  const padDetails = 5; // smaller padding inside details blocks
  const lineGap = 1.8;
  const borderW = 0.7;

  // Badge and header cell tuning
  const BADGE_R = 9; // circle radius
  const BADGE_D = BADGE_R * 2; // diameter
  const badgeTopGap = 6;
  const badgeTextGap = 6; // gap between badge bottom and the status/title block
  const statusTitleGapY = 3; // gap between status and title

  // Heights for main 6 columns
  const topH = 48 + badgeTopGap + BADGE_D + badgeTextGap; // status + title with badge space
  const midH = 28; // delivery days
  const detH = 128; // details
  const colH = topH + midH + detH;

  // Seventh stage (full-width, 3 columns in one short row)
  const lastRowGapY = 12;
  const lastH = 70;

  // Title spacing estimate (keep title with table)
  const TITLE_CONSUME = 28;

  // ===== Compute geometry (with width boost) =====
  const pageContentMax = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const remaining = ctx.y - ctx.margin.bottom;
  const contentW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const effectiveContentW = contentW + WIDTH_BOOST; // width gain
  const halfBoost = WIDTH_BOOST / 2;
  const startX = rtl
    ? ctx.pageWidth - ctx.margin.right - effectiveContentW
    : ctx.margin.left - halfBoost;

  const colCount = Math.max(1, Math.min(6, stagesMain.length));
  const colW = (effectiveContentW - (colCount - 1) * colGapX) / colCount;

  const plannedTotal =
    TITLE_CONSUME + colH + (stageLast ? lastRowGapY + lastH : 0);
  const needsOwnPage =
    remaining < 0.45 * pageContentMax || remaining < plannedTotal;
  if (needsOwnPage) await ctx.newPage();

  // Title
  await ctx.writeTitle(FIXED_TEXT.titles.allStagesMatrix[lng]);

  // ===== Fonts (responsive) =====
  let fsTop = 12,
    fsMid = 11.5,
    fsDet = 10.5; // base
  if (colW < 120) {
    fsTop = 11.5;
    fsMid = 11;
    fsDet = 10;
  }
  if (colW < 104) {
    fsTop = 11;
    fsMid = 10.5;
    fsDet = 9.5;
  }

  const fsBadge = Math.max(10, fsTop - 0.5);
  const fsStatus = Math.max(9, fsTop - 1.5);
  const fsTitle = Math.min(fsTop + 0.5, 13.5);
  const fsLast = Math.max(10, fsTop - 0.5);

  // ===== Helpers =====
  const pickFont = (text, { bold = false } = {}) => {
    const isArHere = isArabicText ? isArabicText(text) : rtl;
    if (isArHere) return bold ? fonts?.arBold || fonts?.arFont : fonts?.arFont;
    return bold ? fonts?.enBold || fonts?.enFont : fonts?.enFont;
  };

  const drawBox = ({
    x,
    yTop,
    w,
    h,
    fill = colors.accentBg,
    stroke = colors.borderColor,
  }) => {
    ctx.page.drawRectangle({
      x,
      y: yTop - h,
      width: w,
      height: h,
      color: fill || undefined,
      borderColor: stroke || undefined,
      borderWidth: borderW,
    });
  };

  // centered stage badge (number)
  const drawCenteredBadge = ({ num, x, yTop, w }) => {
    const cx = x + w / 2;
    const cy = yTop - badgeTopGap - BADGE_R;
    ctx.page.drawCircle({
      x: cx,
      y: cy,
      size: BADGE_R,
      borderColor: colors.primaryDark,
      borderWidth: 0.8,
      color: colors.primaryLight,
    });
    const txt = String(num);
    const f = pickFont(txt, { bold: true });
    const tw = f.widthOfTextAtSize(txt, fsBadge);
    ctx.page.drawText(txt, {
      x: cx - tw / 2,
      y: cy - fsBadge / 2 + 1,
      size: fsBadge,
      font: f,
      color: colors.heading,
    });
  };

  // Clamp a single line with ellipsis if it exceeds width
  const clampLineWithEllipsis = (text, font, fs, maxW) => {
    let t = text;
    let w = font.widthOfTextAtSize(t, fs);
    if (w <= maxW) return t;
    const ell = "…";
    const ellW = font.widthOfTextAtSize(ell, fs);
    let lo = 0,
      hi = t.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const cand = t.slice(0, mid) + ell;
      if (font.widthOfTextAtSize(cand, fs) <= maxW) lo = mid + 1;
      else hi = mid;
    }
    const cut = Math.max(0, lo - 1);
    return t.slice(0, cut) + ell;
  };

  // Wrap into maxLines; last line ellipsized if needed
  const wrapWithHardClamp = (
    text,
    { maxW, fs, bold = false, maxLines = 2 }
  ) => {
    const f = pickFont(text, { bold });
    const shaped =
      rtl && (isArabicText ? isArabicText(text) : true)
        ? reText(String(text || ""))
        : String(text || "");
    const lines = splitTextIntoLines(shaped, maxW, f, fs);
    if (lines.length <= maxLines) return { f, lines };
    const kept = lines.slice(0, maxLines - 1);
    const lastRaw = lines[maxLines - 1] || "";
    const clamped = clampLineWithEllipsis(lastRaw, f, fs, maxW);
    kept.push(clamped);
    return { f, lines: kept };
  };

  // centered text block (multiple lines)
  const drawTextCentered = (
    text,
    {
      x,
      yTop,
      w,
      h,
      fs,
      bold = false,
      color = colors.textColor,
      padOverride = null,
      maxLines = 2,
    }
  ) => {
    const innerPad = padOverride == null ? pad : padOverride;
    const maxTextW = Math.max(0, w - innerPad * 2);
    const { f, lines } = wrapWithHardClamp(text, {
      maxW: maxTextW,
      fs,
      bold,
      maxLines,
    });
    const lineHeight = fs + lineGap;
    const blockH = Math.min(
      lines.length * lineHeight,
      Math.max(lineHeight, h - innerPad * 2)
    );
    let cy = yTop - (h - blockH) / 2 - fs;
    for (let i = 0; i < lines.length; i++) {
      if (cy < yTop - h + innerPad) break;
      const ln = lines[i];
      const lnW = f.widthOfTextAtSize(ln, fs);
      const cx = x + w / 2 - lnW / 2;
      ctx.page.drawText(ln, { x: cx, y: cy, size: fs, font: f, color });
      cy -= lineHeight;
      if (cy < yTop - h + innerPad) break;
    }
  };

  // details with bullets (NOT bold)
  const drawBulletsClipped = (
    items,
    { x, yTop, w, h, fs = fsDet, color = colors.textColor }
  ) => {
    const bulletGap = 3;
    const innerPad = padDetails;
    const fBullet = fonts?.enFont || pickFont("", { bold: false }); // NOT bold
    const lineHeight = fs + bulletGap;
    const maxLines = Math.max(
      1,
      Math.floor((h - innerPad * 2 + bulletGap) / lineHeight)
    );
    let linesUsed = 0;
    let cy = yTop - innerPad - fs;
    const maxTextW = w - innerPad * 2 - 12;

    for (let idx = 0; idx < items.length; idx++) {
      if (linesUsed >= maxLines) break;
      const raw = String(items[idx] || "");
      const isArItem = rtl && (isArabicText ? isArabicText(raw) : true);
      const f = pickFont(raw, { bold: false }); // NOT bold
      const shaped = isArItem ? reText(raw) : raw;
      const wrapped = splitTextIntoLines(shaped, maxTextW, f, fs);

      // bullet dot
      if (isArItem) {
        ctx.page.drawText("•", {
          x: x + w - innerPad - 8,
          y: cy,
          size: fs,
          font: fBullet,
          color,
        });
      } else {
        ctx.page.drawText("•", {
          x: x + innerPad,
          y: cy,
          size: fs,
          font: fBullet,
          color,
        });
      }

      // first line
      const first = wrapped[0] || "";
      const tx0 = isArItem
        ? getRTLTextX(first, fs, f, x + innerPad, w - innerPad * 2 - 12)
        : x + innerPad + 12;

      ctx.page.drawText(first, { x: tx0, y: cy, size: fs, font: f, color });
      cy -= lineHeight;
      linesUsed++;

      // continuation lines
      for (let i = 1; i < wrapped.length && linesUsed < maxLines; i++) {
        const ln = wrapped[i];
        const tx = isArItem
          ? getRTLTextX(ln, fs, f, x + innerPad, w - innerPad * 2 - 12)
          : x + innerPad + 12;
        ctx.page.drawText(ln, { x: tx, y: cy, size: fs, font: f, color });
        cy -= lineHeight;
        linesUsed++;
      }

      if (linesUsed < maxLines) cy -= 1.2; // tiny gap between bullets
    }
  };

  const colXAt = (index, colW) => {
    if (!rtl) return startX + index * (colW + colGapX);
    return startX + effectiveContentW - (index + 1) * colW - index * colGapX;
  };

  // ===== Main row: 6 columns =====
  await ctx.need(colH);
  const rowTop = ctx.y;

  stagesMain.forEach((s, i) => {
    const stData = stagesMap.get(s.order) || {};
    const included = stagesMap.has(s.order);
    const deliveryDays = stData?.deliveryDays;

    const statusText = included
      ? rtl
        ? "يشمل العقد"
        : "Included"
      : rtl
      ? "لا يشمل العقد"
      : "Not included";

    const daysStr =
      included && deliveryDays != null
        ? rtl
          ? `${formatNumber(deliveryDays, "ar")} يوم`
          : `${deliveryDays} days`
        : "—";

    const details = (STAGE_PROGRESS?.[s.order]?.[lng] || []).slice();
    if (stData?.notes) details.push(String(stData.notes));

    const x = colXAt(i, colW);

    // Top cell (status + title)
    drawBox({
      x,
      yTop: rowTop,
      w: colW,
      h: topH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });

    // centered badge with stage number
    drawCenteredBadge({ num: s.order, x, yTop: rowTop, w: colW });

    // two-tier text inside header
    (function drawTwoTierCentered() {
      const innerPad = pad;
      const textAreaTop = rowTop - (badgeTopGap + BADGE_D + badgeTextGap);
      const textAreaH = topH - (badgeTopGap + BADGE_D + badgeTextGap);

      // status
      const f1 = pickFont(statusText, { bold: false });
      const statusMaxW = colW - innerPad * 2;
      const t1raw = rtl ? reText(statusText) : statusText;
      const t1 = clampLineWithEllipsis(t1raw, f1, fsStatus, statusMaxW);
      const w1 = f1.widthOfTextAtSize(t1, fsStatus);

      // title (1-2 lines)
      const titleMaxW = colW - innerPad * 2;
      const { f: f2, lines: titleLines } = wrapWithHardClamp(s.label, {
        maxW: titleMaxW,
        fs: fsTitle,
        bold: true,
        maxLines: 2,
      });

      const lh1 = fsStatus + lineGap;
      const lh2 = fsTitle + lineGap;
      const titleBlockH = titleLines.length * lh2;
      const blockH = lh1 + statusTitleGapY + titleBlockH;

      let cy = textAreaTop - (textAreaH - blockH) / 2 - fsStatus;

      // status
      ctx.page.drawText(t1, {
        x: x + colW / 2 - w1 / 2,
        y: cy,
        size: fsStatus,
        font: f1,
        color: included ? colors.success : colors.red,
      });
      cy -= lh1 + statusTitleGapY;

      // title
      for (let i = 0; i < titleLines.length; i++) {
        const ln = rtl ? reText(titleLines[i]) : titleLines[i];
        const w2 = f2.widthOfTextAtSize(ln, fsTitle);
        ctx.page.drawText(ln, {
          x: x + colW / 2 - w2 / 2,
          y: cy,
          size: fsTitle,
          font: f2,
          color: colors.heading,
        });
        cy -= lh2;
      }
    })();

    // Middle cell (days)
    const midTop = rowTop - topH;
    drawBox({
      x,
      yTop: midTop,
      w: colW,
      h: midH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });
    drawTextCentered(daysStr, {
      x,
      yTop: midTop,
      w: colW,
      h: midH,
      fs: fsMid,
      bold: false,
      maxLines: 1,
    });

    // Details cell
    const detTop = midTop - midH;
    drawBox({
      x,
      yTop: detTop,
      w: colW,
      h: detH,
      fill: colors.accentBg,
      stroke: colors.borderColor,
    });
    drawBulletsClipped(details, {
      x,
      yTop: detTop,
      w: colW,
      h: detH,
      fs: fsDet,
    });
  });

  ctx.y = rowTop - colH;

  // ===== Seventh stage (disabled in this version) =====
  if (stageLast) {
    // (kept as in your source; unreachable since stageLast is undefined)
  }
}

//two sections (kept commented)

// === PAGE-SPACE GUARDS ADDED HERE ===
async function renderStageClauses(ctx, { lng, fonts, colors }) {
  // Require at least 20% of page; otherwise new page
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const minHeightNeeded = usableHeight * 0.2;
  const remaining = ctx.y - ctx.margin.bottom;
  if (remaining < minHeightNeeded) {
    await ctx.need(usableHeight);
  }

  // extra spacing before this section starts (kept)
  ctx.y -= 16;

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
  // Require at least 20% of page; otherwise new page
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const minHeightNeeded = usableHeight * 0.2;
  const remaining = ctx.y - ctx.margin.bottom;
  if (remaining < minHeightNeeded) {
    await ctx.need(usableHeight);
  }

  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الثاني" : "Party Two Obligations"
  );
  const text = OBLIGATIONS_TEXT.partyTwo[lng] || "";
  await writeParagraphOrList(ctx, text, { fonts, colors, fs: 11 });
}

async function renderHandwrittenSpecialClauses(ctx, { lng, fonts, colors }) {
  // Require at least 30% of page; otherwise new page
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const minHeightNeeded = usableHeight * 0.3;
  const remaining = ctx.y - ctx.margin.bottom;
  if (remaining < minHeightNeeded) {
    await ctx.need(usableHeight);
  }

  const items = HANDWRITTEN_SPECIAL_CLAUSES?.[lng] || [];
  if (!items.length) return;
  await ctx.writeTitle(lng === "ar" ? "بنود خاصة " : "Special Terms");
  await writeParagraphOrList(ctx, items.map((t) => ` ${t}`).join("\n"), {
    fonts,
    colors,
    fs: 11,
  });
}

async function renderDrawingsSection(
  ctx,
  { lng, contract, defaultDrawingUrl, fonts, colors }
) {
  const drawings = contract?.drawings || [];
  const toRender = drawings.length
    ? drawings.map((d) => d.url)
    : defaultDrawingUrl
    ? [defaultDrawingUrl]
    : [];

  const maxW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
  const maxH = 150;

  // Usable page height for forcing a new page
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;

  // Helper: scale embedded image to fit maxW/maxH
  const getScaledSize = (img) => {
    let { width: sw, height: sh } = img.size();
    const r = Math.min(maxW / sw, maxH / sh, 1);
    return { W: sw * r, H: sh * r };
  };

  // Spacing constants (match your drawing flow)
  const TITLE_RESERVE = 40; // matches ctx.writeTitle need (fs 14 + 26)
  const IMG_BLOCK_NEED = (h) => h + 16; // block need when placing an image (fit + margins)
  const IMG_AFTER_Y = (h) => h + 16; // y decrement after drawing

  // ===== Prefetch FIRST image so we can measure before deciding page break =====
  let firstImg = null;
  let firstUrl = null;
  let firstSize = null;

  if (toRender.length) {
    firstUrl = toRender[0];
    try {
      const bytes = await fetchImageBuffer(firstUrl);
      try {
        firstImg = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        firstImg = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (firstImg) firstSize = getScaledSize(firstImg);
    } catch {
      // ignore; we'll show URL fallback after title if needed
    }
  }

  // If we have a measurable first image, ensure we have room for: title + that image
  if (firstImg && firstSize) {
    const firstBlockNeed = TITLE_RESERVE + IMG_BLOCK_NEED(firstSize.H);
    const remaining = ctx.y - ctx.margin.bottom;

    if (remaining < firstBlockNeed) {
      // force a new page so title + first image stay together
      await ctx.need(usableHeight);
    }
  }

  // Title (always render the section title like your current behavior)
  await ctx.writeTitle(FIXED_TEXT.titles.drawings[lng]);

  // Draw FIRST image (or fallback to URL text if embedding failed)
  let startIndex = 0;
  if (firstUrl) {
    startIndex = 1;
    if (firstImg && firstSize) {
      const { W, H } = firstSize;

      // ensure the actual image block fits on the current page
      if (ctx.y - ctx.margin.bottom < IMG_BLOCK_NEED(H)) {
        await ctx.need(usableHeight);
      }
      await ctx.need(IMG_BLOCK_NEED(H));

      const centerX = ctx.margin.left + (maxW - W) / 2;
      ctx.page.drawImage(firstImg, {
        x: centerX,
        y: ctx.y - H,
        width: W,
        height: H,
      });
      ctx.y -= IMG_AFTER_Y(H);
    } else {
      // Fallback: show the URL if we couldn't embed the first image
      await ctx.writeLineAuto(firstUrl, 10, false, colors.red);
    }
  }

  // ===== Render the rest, checking each image’s own height exactly =====
  for (let idx = startIndex; idx < toRender.length; idx++) {
    const rawUrl = toRender[idx];
    try {
      const bytes = await fetchImageBuffer(rawUrl);
      let img;
      try {
        img = await ctx.pdfDoc.embedPng(bytes);
      } catch {
        img = await ctx.pdfDoc.embedJpg(bytes);
      }
      if (!img) continue;

      const { W, H } = getScaledSize(img);

      // If not enough space for THIS image block, start a new page
      if (ctx.y - ctx.margin.bottom < IMG_BLOCK_NEED(H)) {
        await ctx.need(usableHeight);
      }
      await ctx.need(IMG_BLOCK_NEED(H));

      const centerX = ctx.margin.left + (maxW - W) / 2;
      ctx.page.drawImage(img, {
        x: centerX,
        y: ctx.y - H,
        width: W,
        height: H,
      });

      ctx.y -= IMG_AFTER_Y(H);
    } catch {
      await ctx.writeLineAuto(rawUrl, 10, false, colors.red);
    }
  }
}

// async function renderDrawingsSection(
//   ctx,
//   { lng, contract, defaultDrawingUrl, fonts, colors }
// ) {
//   const drawings = contract?.drawings || [];
//   const toRender = drawings.length
//     ? drawings.map((d) => d.url)
//     : defaultDrawingUrl
//     ? [defaultDrawingUrl]
//     : [];

//   const maxW = ctx.pageWidth - ctx.margin.left - ctx.margin.right;
//   const maxH = 150;

//   // ---- half-page guard helpers ----
//   const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
//   const minHeightNeeded = usableHeight * 0.3;

//   const ensureHalfPageRemaining = async () => {
//     const remaining = ctx.y - ctx.margin.bottom;
//     if (remaining < minHeightNeeded) {
//       await ctx.need(usableHeight);
//     }
//   };

//   // Ensure we have >= 50% page left before starting this block
//   await ensureHalfPageRemaining();
//   await ctx.writeTitle(FIXED_TEXT.titles.drawings[lng]);

//   for (const rawUrl of toRender) {
//     try {
//       const bytes = await fetchImageBuffer(rawUrl);
//       let img;
//       try {
//         img = await ctx.pdfDoc.embedPng(bytes);
//       } catch {
//         img = await ctx.pdfDoc.embedJpg(bytes);
//       }
//       if (!img) continue;

//       // Before drawing each image, ensure >= 50% of page is left
//       await ensureHalfPageRemaining();

//       let { width: sw, height: sh } = img.size();
//       let W = sw,
//         H = sh;
//       const r = Math.min(maxW / W, maxH / H, 1);
//       W *= r;
//       H *= r;

//       // Also make sure the actual image block fits (your original check)
//       await ctx.need(H + 28);

//       const centerX = ctx.margin.left + (maxW - W) / 2;

//       ctx.page.drawImage(img, {
//         x: centerX,
//         y: ctx.y - H,
//         width: W,
//         height: H,
//       });

//       ctx.y -= H + 16;
//     } catch {
//       await ctx.writeLineAuto(rawUrl, 10, false, colors.red);
//     }
//   }
// }

async function renderConfirmationAndSignaturePage(
  ctx,
  { lng, clientName, signatureUrl, fonts, colors }
) {
  await ctx.newPage();

  // Confirmation
  await ctx.writeTitle(FIXED_TEXT.titles.confirmation[lng]);

  // Day name + date
  const locale = lng === "ar" ? "ar" : "en";
  dayjs.locale(locale);
  const todayDate = dayjs().format("DD/MM/YYYY");
  const weekday = dayjs().format("dddd");

  // Additional approval paragraph and lines
  const approvalAr =
    "التوقيع والاعتماد :\n" +
    "قام الطرف الاولي بالاطلاع علي جميع بنود الإتفاقية بالتفصيل , وعليها يوقع ويلتزم.\n" +
    `وقعت هذه الاتفاقية يوم : ${weekday} بتاريخ ${reverseString(
      todayDate.toString()
    )}\n`;
  const approvalEn =
    "Signature & Approval:\n" +
    "Party One has reviewed all agreement terms in detail and hereby signs and commits.\n" +
    `This agreement was signed on: ${weekday}, dated ${todayDate}\n`;

  await ctx.writeLineAuto(
    FIXED_TEXT.confirmationLabel[lng] ||
      (lng === "ar"
        ? "أقرّ بأنني قرأت جميع البنود وأوافق عليها"
        : "I confirm that I have read and agree to all terms"),
    12,
    false,
    colors.textColor
  );
  ctx.y -= 8;
  await ctx.writeLineAuto(
    lng === "ar" ? approvalAr : approvalEn,
    11,
    false,
    colors.textColor
  );
  ctx.y -= 10;

  // Parties line (pulled inward slightly)
  const colGap = 28;
  const innerEdgeInset = 8;
  const colW =
    (ctx.pageWidth -
      ctx.margin.left -
      ctx.margin.right -
      colGap -
      innerEdgeInset * 2) /
    2;
  const leftX = ctx.margin.left + innerEdgeInset;
  const rightX = ctx.margin.left + innerEdgeInset + colW + colGap;
  let leftY = ctx.y;
  let rightY = ctx.y;

  const secondParty = lng === "ar" ? "الفـــــريق الـــــثاني" : "Second Party";
  const firstParty = lng === "ar" ? "الفـــــريـــــق الاول" : "First Party";
  const sigLabel = lng === "ar" ? "التوقيع:" : "Signature:";
  const secondPartyName = "دريم ستوديوو";
  const firstPartyName = clientName || (lng === "ar" ? "المالك" : "Owner");

  // helper: resolve x according to language (RTL aligns to the right edge of the cell)
  const rtlX = (baseX, text, size, font) =>
    lng === "ar"
      ? getRTLTextX(text, size, font, baseX, colW) // align to right within the cell box
      : baseX;

  // Left block (Team Two)
  {
    const { bold } = pickFontsForText(secondParty, fonts);
    const title = lng === "ar" ? reText(secondParty) : secondParty;
    ctx.page.drawText(title, {
      x: rtlX(leftX, title, 12, bold),
      y: leftY,
      size: 12,
      font: bold,
      color: colors.heading,
    });
    leftY -= 16;

    const nameTxt = lng === "ar" ? reText(secondPartyName) : secondPartyName;
    const nameFont = pickFontsForText(secondPartyName, fonts).font;
    ctx.page.drawText(nameTxt, {
      x: rtlX(leftX, nameTxt, 11, nameFont),
      y: leftY,
      size: 11,
      font: nameFont,
      color: colors.textColor,
    });
    leftY -= 16;

    const sigTxt = lng === "ar" ? reText(sigLabel) : sigLabel;
    const sigFont = pickFontsForText(sigLabel, fonts).font;
    ctx.page.drawText(sigTxt, {
      x: rtlX(leftX, sigTxt, 11, sigFont),
      y: leftY,
      size: 11,
      font: sigFont,
      color: colors.textColor,
    });
    leftY -= 60; // space for stamp/signature
  }

  // Right block (Team One)
  {
    const { bold } = pickFontsForText(firstParty, fonts);
    const title = lng === "ar" ? reText(firstParty) : firstParty;
    ctx.page.drawText(title, {
      x: rtlX(rightX, title, 12, bold),
      y: rightY,
      size: 12,
      font: bold,
      color: colors.heading,
    });
    rightY -= 16;

    const roleName =
      lng === "ar" ? "المالك او وكيله" : "Owner or Authorized Representative";
    const roleTxt = lng === "ar" ? reText(roleName) : roleName;
    const roleFont = pickFontsForText(roleName, fonts).font;
    ctx.page.drawText(roleTxt, {
      x: rtlX(rightX, roleTxt, 11, roleFont),
      y: rightY,
      size: 11,
      font: roleFont,
      color: colors.textColor,
    });
    rightY -= 14;

    const firstNameTxt = lng === "ar" ? reText(firstPartyName) : firstPartyName;
    const firstNameFont = pickFontsForText(firstPartyName, fonts).font;
    ctx.page.drawText(firstNameTxt, {
      x: rtlX(rightX, firstNameTxt, 11, firstNameFont),
      y: rightY,
      size: 11,
      font: firstNameFont,
      color: colors.textColor,
    });
    rightY -= 16;

    const sigTxt = lng === "ar" ? reText(sigLabel) : sigLabel;
    const sigFont = pickFontsForText(sigLabel, fonts).font;
    ctx.page.drawText(sigTxt, {
      x: rtlX(rightX, sigTxt, 11, sigFont),
      y: rightY,
      size: 11,
      font: sigFont,
      color: colors.textColor,
    });
    rightY -= 60;
  }

  // Stamp/signature (Team Two)
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
    }
  } catch {}

  // Client signature image — pulled inward from the outer edge
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
        const maxW = colW - 20;
        const maxH = 150;
        let { width: sw, height: sh } = sig.size();
        let W = sw,
          H = sh;
        const r = Math.min(maxW / W, maxH / H, 1);
        W *= r;
        H *= r;
        ctx.page.drawImage(sig, {
          x: rightX + 20,
          y: rightY - H + 40,
          width: W,
          height: H,
        });
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

  // Palette
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
    title: lng === "ar" ? "" : "",
    fonts,
    colors,
  });

  // 2) Content
  await ctx.ensurePage();
  await renderClientSection(ctx, { lng, contract, fonts, colors });
  await renderAmountSection(ctx, { lng, contract });
  await renderDbSpecialItems(ctx, { lng, contract, fonts, colors });
  await renderPartyOneWithPayments(ctx, { lng, contract, fonts, colors });
  await renderStagesTable(ctx, { lng, contract, fonts, colors });
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

  // 4) Footer (exclude intro page and push lower)
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
      stages: {
        include: {
          project: true,
        },
      },
      paymentsNew: {
        include: {
          project: true,
        },
      },
      drawings: true,
      specialItems: true,
    },
  });
  if (!contract) throw new Error("Contract not found");

  const clientName = contract.clientLead?.client?.name || "";
  const clientLeadId = contract.clientLeadId;
  const arPdfBytes = await generateContractPdf({
    contract,
    lng: "ar",
    clientName,
    signatureUrl,
    backgroundImageUrl,
    introImageUrl,
    defaultDrawingUrl,
    padding: { top: 72, right: 56, bottom: 72, left: 56 },
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
    backgroundImageUrl,
    introImageUrl,
    defaultDrawingUrl,
    padding: { top: 72, right: 56, bottom: 72, left: 56 },
  });
  const enPublicUrl = await generateContractPdfLinksInBothLanguages({
    contract,
    lng: "en",
    pdfBytes: enPdfBytes,
  });
  await notifyUsersThatAContractWasSigned({ clientLeadId: clientLeadId });

  await sendSuccessEmailAfterContractSigned({
    token,
    clientLeadId,
    arPdfUrl: arPublicUrl,
    enPdfUrl: enPublicUrl,
    lng,
  });
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
  const publicUrl = `${
    process.env.ISLOCAL ? "https://panel.dreamstudiio.com" : process.env.SERVER
  }/uploads/${fileName}`;

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
