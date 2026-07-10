import FinalizedLeadKanban from "@/features/Kanban/staff/FinalizedLeadKanban";
import { Suspense } from "react";

export default async function page(props) {
  const searchParams = await props.searchParams;
  return (
    <Suspense>
      <FinalizedLeadKanban staffId={searchParams.staffId} />;
    </Suspense>
  );
}
