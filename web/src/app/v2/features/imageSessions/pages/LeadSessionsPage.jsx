"use client";

// SURFACE 2 — thin standalone route page for lead-scoped image-session management. The real UI
// is the self-contained <LeadSessionsPanel clientLeadId /> (exported from the feature barrel for
// a later wave to mount inside the lead-detail tabs). This page just frames the panel with a
// PageHeader + breadcrumb so the route /v2/image-sessions/lead/[leadId] renders standalone.
// Object scope is enforced SERVER-SIDE; actions gate on the IMAGE_SESSION.SESSION_* CODES (no
// capabilities.*). Single-language Arabic / RTL.

import { Box } from "@mui/material";
import { PageHeader } from "@/app/v2/shared/components";
import { LeadSessionsPanel } from "../components/LeadSessionsPanel.jsx";

export function LeadSessionsPage({ clientLeadId }) {
  return (
    <Box dir="rtl">
      <PageHeader
        title="جلسات الصور للعميل المحتمل"
        subtitle={`العميل المحتمل #${clientLeadId}`}
        breadcrumbs={[
          { label: "المبيعات" },
          { label: "الصفقات", href: "/v2/leads" },
          // Parent-lead crumb links back to the lead hub so the session page isn't a dead-end.
          // clientLeadId is the parent lead id (this page is /v2/image-sessions/lead/[leadId]).
          { label: `العميل #${clientLeadId}`, href: `/v2/leads/${clientLeadId}` },
          { label: "جلسات الصور" },
        ]}
      />
      <LeadSessionsPanel clientLeadId={clientLeadId} />
    </Box>
  );
}

export default LeadSessionsPage;
