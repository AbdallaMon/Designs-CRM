import { writeSubhead, writeBolxParagraphOrList, writeParagraphOrList } from "../contract-pdf-context.js";

export async function renderStageClauses(
  ctx,
  { lng, fonts, colors, defaultContractUtilityData },
) {
  if (!defaultContractUtilityData?.stageClauses?.length) return;
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
  // Render every stage clause row as-is (already ordered by `order asc` from the query),
  // mirroring the web ReadableStageClauses client. The previous `[1..6]` order-match
  // silently dropped every row because the editor writes 0-indexed `order` values.
  for (const data of defaultContractUtilityData.stageClauses) {
    const head = lng === "ar" ? data.headingAr : data.headingEn;
    const title = lng === "ar" ? data.titleAr : data.titleEn;
    const text =
      (lng === "ar" ? data?.descriptionAr : data?.descriptionEn) || "";
    await writeSubhead(ctx, head, { fonts, colors, fs: 12 });
    await writeBolxParagraphOrList(ctx, title, { fonts, colors, fs: 11 });
    await writeParagraphOrList(ctx, text, { fonts, colors, fs: 11 });
    ctx.y -= 2;
  }
}
