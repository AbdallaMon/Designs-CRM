import { writeParagraphOrList } from "../contract-pdf-context.js";
import { OBLIGATIONS_TEXT } from "../witten-blocks-data.js";

export async function renderPartyTwoObligations(
  ctx,
  { lng, fonts, colors, defaultContractUtilityData },
) {
  // Require at least 20% of page; otherwise new page
  const usableHeight = ctx.pageHeight - ctx.margin.top - ctx.margin.bottom;
  const minHeightNeeded = usableHeight * 0.2;
  const remaining = ctx.y - ctx.margin.bottom;
  if (remaining < minHeightNeeded) {
    await ctx.need(usableHeight);
  }

  await ctx.writeTitle(
    lng === "ar" ? "التزامات الفريق الثاني" : "Party Two Obligations",
  );
  // const text = OBLIGATIONS_TEXT.partyTwo[lng] || "";
  const text =
    lng === "ar"
      ? defaultContractUtilityData?.obligationsPartyTwoAr
      : defaultContractUtilityData?.obligationsPartyTwoEn;
  await writeParagraphOrList(ctx, text, { fonts, colors, fs: 11 });
}
