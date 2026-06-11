"use client";

// <LeadOrientationBand> — a slim ORIENTATION band that sits ABOVE the hub header (which keeps
// the H1). It answers "where am I?" (a breadcrumb: العملاء المحتملون ‹ {client name}) on the
// inline-START and "what's my next move?" (ONE role-adaptive primary action) on the inline-END.
//
// The primary action is CAPABILITY-gated, never role-gated — the role only chooses WHICH
// capability we surface. To avoid duplicating any dialog/mutation state, the role-specific
// actions NAVIGATE to the section that already owns the real CTA (the add-payment dialog lives
// in the payments tab, the advance-stage action in the sales-stage panel, etc.). When no
// capability-backed action applies, we fall back to the existing LeadStatusMenu so the band is
// never an empty dead-end. Single Arabic / RTL; theme tokens only.

import { Box, Breadcrumbs, Button, Link as MuiLink, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { MdTrendingUp, MdPayments, MdWork } from "react-icons/md";
import { LeadStatusMenu } from "./LeadStatusMenu.jsx";

const DESIGNER_ROLES = ["THREE_D_DESIGNER", "TWO_D_DESIGNER", "TWO_D_EXECUTOR"];

// Resolve the single role-adaptive primary action as { label, icon, onClick } — or null when no
// capability-backed action applies (caller then renders the status menu fallback). `caps` is
// lead.capabilities; `gates` is the page's resolved section-gate map; `onNavigate(group, sub)`
// deep-links to a section.
function resolvePrimaryAction({ user, caps, gates, onNavigate }) {
  const role = user?.role;
  const isSuperSales = Boolean(user?.isSuperSales) || role === "SUPER_SALES";

  // sales / STAFF / super-sales → advance the sale. Surfaced iff the sales-stage section is
  // visible (PERMISSIONS.SALES_STAGE.VIEW). The panel there owns the real advance mutation.
  if ((role === "STAFF" || isSuperSales) && gates?.stage) {
    return {
      label: "متابعة مرحلة البيع",
      icon: <MdTrendingUp />,
      onClick: () => onNavigate("sales", "salesStage"),
    };
  }

  // accountant → add a payment, iff the capability is present. Navigates to the payments
  // section where AddPaymentDialog lives.
  if (role === "ACCOUNTANT" && caps?.canAddPayment) {
    return {
      label: "إضافة دفعة",
      icon: <MdPayments />,
      onClick: () => onNavigate("finance", "payments"),
    };
  }

  // 3D / 2D designer + executor → open the project, iff the projects section is visible (we
  // cannot know a concrete project exists from the lead payload, so we gate on section access).
  if (DESIGNER_ROLES.includes(role) && gates?.projects) {
    return {
      label: "فتح المشروع",
      icon: <MdWork />,
      onClick: () => onNavigate("production", "projects"),
    };
  }

  return null;
}

export function LeadOrientationBand({
  lead,
  canChangeStatus,
  beginner,
  gates,
  user,
  onNavigate,
  onChanged,
}) {
  if (!lead) return null;
  const caps = lead.capabilities ?? {};
  const clientName = lead.client?.name ?? `#${lead.id}`;
  const primary = resolvePrimaryAction({ user, caps, gates, onNavigate });

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={1}
      sx={{ mb: 1.5 }}
    >
      <Breadcrumbs aria-label="مسار التنقل" sx={{ minWidth: 0 }}>
        <MuiLink
          component={NextLink}
          href="/v2/leads"
          underline="hover"
          color="text.secondary"
          variant="body2"
        >
          العملاء المحتملون
        </MuiLink>
        <Typography color="text.primary" variant="body2" noWrap sx={{ maxWidth: 280 }}>
          {clientName}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ flexShrink: 0 }}>
        {primary ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={primary.icon}
            onClick={primary.onClick}
          >
            {primary.label}
          </Button>
        ) : (
          // Fallback: the existing status menu (self-gates on canChangeStatus — renders nothing
          // when the user cannot change status, leaving the band breadcrumb-only).
          <LeadStatusMenu
            lead={lead}
            canChangeStatus={canChangeStatus}
            beginner={beginner}
            onChanged={onChanged}
          />
        )}
      </Box>
    </Stack>
  );
}

export default LeadOrientationBand;
