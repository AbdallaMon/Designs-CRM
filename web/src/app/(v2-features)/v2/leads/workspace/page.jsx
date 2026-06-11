import { Suspense } from "react";
import { LeadsWorkspacePage } from "@/app/v2/features/leads";

// Static `workspace` segment — wins over the sibling dynamic [id] route, so /v2/leads/workspace
// renders the cockpit (not the lead detail). Inherits the leads route-group layout (AuthedAppLayout).
export default function Page() {
  return (
    <Suspense>
      <LeadsWorkspacePage />
    </Suspense>
  );
}
