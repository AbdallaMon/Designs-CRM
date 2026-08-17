import { EMIRATES } from "@dms/shared";
import { pickFontsForText, ASCII_RE } from "../contract-pdf-context.js";
import { getRTLTextX, reText, splitTextIntoLines, reverseString } from "../../../../infra/pdf/pdf-helpers.js";
import { FIXED_TEXT, COUNTRY_LABEL, EMIRATE_LABEL, UAE_LABEL } from "../witten-blocks-data.js";
import dayjs from "dayjs";

export async function renderClientSection(ctx, { lng, contract, fonts, colors }) {
  await ctx.writeTitle(FIXED_TEXT.titles.partyOne[lng]);

  const owner = contract?.clientLead?.client || {};
  const name =
    (lng === "ar" ? owner?.arName : owner?.enName || owner?.arName) ||
    owner?.name;
  const lead = contract?.clientLead || {};
  const emirate = lead?.emirate || null;
  const country = lead?.country || null;
  const code =
    lng === "ar"
      ? reverseString(lead?.code || lead?.id.toString())
      : lead?.code || lead?.id.toString();
  const projectType =
    lng === "ar" ? contract.title : contract.enTitle || contract.title;

  const address = (() => {
    if (!emirate || emirate === EMIRATES.OUTSIDE) {
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
    [lng === "ar" ? "اسم المالك" : "Owner name", String(name || "-")],
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
      valueFS,
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
