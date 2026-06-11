// v2 questions route shell (foundation). Questions are LEAD-SCOPED, so this thin panel reads
// the lead from `?leadId=` (Next 16: searchParams is async) and hands it to the client panel,
// which fetches that lead's question-type config via the v2 data layer, permission-gated. This
// proves the wiring; the full session-questions / VERSA UI lands in the UX-redesign phase.
import { Suspense } from "react";
import { QuestionsPanel } from "@/app/v2/features/questions";

export default async function Page({ searchParams }) {
  const sp = (await searchParams) ?? {};
  const leadId = sp.leadId;
  return (
    <Suspense>
      <QuestionsPanel leadId={leadId} />
    </Suspense>
  );
}
