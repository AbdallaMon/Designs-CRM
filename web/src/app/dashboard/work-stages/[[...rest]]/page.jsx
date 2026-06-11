import { redirect } from "next/navigation";

// Cutover Step C — redirect shell. server/services/notification.js
// (updateWorkStageStatusNotification, FROZEN) builds in-app notification links from one of
// three work-stage bases in server/services/links.js, each concatenated with a LEAD id:
//   workStagesLink       = `${OLDORIGIN}/dashboard/work-stages/{leadId}`        (admin)
//   threeDworkStageLink  = `${OLDORIGIN}/dashboard/work-stages/three-d/{leadId}` (3D designer)
//   twoDworkStageLink    = `${OLDORIGIN}/dashboard/work-stages/two-d/{leadId}`   (2D designer)
// In every case the trailing path segment is a LEAD id (a work stage belongs to a lead — the
// `link + leadId` concatenation in notification.js is unambiguous). v2 has no dedicated
// work-stage route; work-stage status lives inside the lead detail, so all three variants map
// to the v2 lead detail. The `three-d` / `two-d` discriminator only chose the legacy audience,
// not a different entity, so it is intentionally discarded here.
//
// This optional catch-all matches all three shapes:
//   rest = [leadId]            -> admin variant
//   rest = ["three-d", leadId] -> 3D variant
//   rest = ["two-d", leadId]   -> 2D variant
// The lead id is always the last segment. If `rest` is empty/missing (no such frozen link, but
// defensive), fall back to the v2 leads list. Authed route → unauthenticated click falls
// through to /login (correct).
export default async function Page({ params }) {
  const { rest } = await params;
  const segments = Array.isArray(rest) ? rest : rest ? [rest] : [];
  const leadId = segments[segments.length - 1];
  redirect(leadId ? `/v2/leads/${leadId}` : "/v2/leads");
}
