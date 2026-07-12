import { writeParagraphOrList } from "../contract-pdf-context.js";

export async function renderHandwrittenSpecialClauses(
  ctx,
  { lng, fonts, colors, defaultContractUtilityData },
) {
  // Require at least 30% of page; otherwise new page
  if (!defaultContractUtilityData?.specialClauses?.length) return;
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const minHeightNeeded = usableHeight * 0.3;
  const remaining = ctx.y - ctx.margin.bottom;
  if (remaining < minHeightNeeded) {
    await ctx.need(usableHeight);
  }

  const items = defaultContractUtilityData?.specialClauses;
  if (!items.length) return;
  await ctx.writeTitle(lng === "ar" ? "بنود خاصة " : "Special Terms");
  await writeParagraphOrList(
    ctx,
    items.map((t) => ` ${lng === "ar" ? t.textAr : t.textEn}`).join("\n"),
    {
      fonts,
      colors,
      fs: 11,
    },
  );
}
