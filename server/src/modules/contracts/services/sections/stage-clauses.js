import { writeSubhead, writeBolxParagraphOrList, writeParagraphOrList } from "../contract-pdf-context.js";
import { STAGE_CLAUSES_DEFAULT } from "../witten-blocks-data.js";

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
  for (const i of [1, 2, 3, 4, 5, 6]) {
    // const text = STAGE_CLAUSES_DEFAULT?.[i]?.[lng];
    const data = defaultContractUtilityData?.stageClauses.find(
      (clause) => clause.order === i,
    );
    // Skip any order whose clause isn't seeded — render what exists instead of crashing on
    // `data.headingAr`. Fully-seeded data (all 6 orders) is unaffected, so real contracts
    // produce identical output.
    if (!data) continue;

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
