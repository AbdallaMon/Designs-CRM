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

import { Box, Breadcrumbs, Button, Chip, Link as MuiLink, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { MdTrendingUp, MdPayments, MdWork, MdCall, MdNoteAdd } from "react-icons/md";
import { LeadStatusMenu } from "./LeadStatusMenu.jsx";

const DESIGNER_ROLES = ["THREE_D_DESIGNER", "TWO_D_DESIGNER", "TWO_D_EXECUTOR"];

// Resolve the single role-adaptive primary action as { label, icon, onClick }. This is the
// orientation band's "what do I do now?" element and it must NEVER be null when the user can act
// on the lead at all (audit C3): a role-specific action is preferred, but when none resolves we
// fall back to a universally-safe next step (log a call, else add a note) so the band is never an
// empty dead-end. Only a genuinely read-only lead (no actionable capability) returns null, and the
// caller then shows a muted "view-only" hint. `caps` is lead.capabilities; `gates` is the page's
// resolved section-gate map; `onNavigate(group, sub)` deep-links to a section; `lead` is read for
// count-guards so we never surface an action that dead-ends.
function resolvePrimaryAction({ user, lead, caps, gates, onNavigate }) {
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

  // accountant → add a payment, iff the capability is present (M5: never surface a dead-end).
  // Navigates to the payments section where AddPaymentDialog lives, auto-opening the dialog.
  if (role === "ACCOUNTANT" && caps?.canAddPayment) {
    return {
      label: "إضافة دفعة",
      icon: <MdPayments />,
      onClick: () => onNavigate("finance", "payments", "add"),
    };
  }

  // 3D / 2D designer + executor → open the project, iff the projects section is visible AND a
  // concrete project actually exists (M5 count-guard: lead._count.projects > 0 — the payload
  // carries it). Without a project this would dead-end on an empty board, so we fall through to
  // the universal safe step below instead.
  if (DESIGNER_ROLES.includes(role) && gates?.projects && (lead?._count?.projects ?? 0) > 0) {
    return {
      label: "فتح المشروع",
      icon: <MdWork />,
      onClick: () => onNavigate("production", "projects"),
    };
  }

  // Universal safe fallback (C3): when no role-specific action resolved, still answer "what do I
  // do now?". Prefer logging a call (the most common daily verb) when the capability is present;
  // otherwise adding a note. Both deep-link to the record group with an auto-open flag (item 4).
  if (caps?.canAddCall) {
    return {
      label: "تسجيل مكالمة",
      icon: <MdCall />,
      onClick: () => onNavigate("record", "calls", "add"),
    };
  }
  if (caps?.canAddNote) {
    return {
      label: "إضافة ملاحظة",
      icon: <MdNoteAdd />,
      onClick: () => onNavigate("record", "notes", "add"),
    };
  }

  // Genuinely read-only for this user — no actionable capability at all.
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
  const primary = resolvePrimaryAction({ user, lead, caps, gates, onNavigate });

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
          // Guaranteed next step (C3): a role-specific action, or the universal call/note fallback.
          <Button
            variant="contained"
            color="primary"
            startIcon={primary.icon}
            onClick={primary.onClick}
          >
            {primary.label}
          </Button>
        ) : canChangeStatus ? (
          // No capability-backed verb, but the user can still drive the workflow → status menu.
          <LeadStatusMenu
            lead={lead}
            canChangeStatus={canChangeStatus}
            beginner={beginner}
            onChanged={onChanged}
          />
        ) : (
          // Genuinely read-only: don't pretend there is an action — show an explicit muted hint
          // so the breadcrumb-only band reads as intentional, not broken.
          <Chip label="وضع العرض فقط" size="small" variant="outlined" color="default" />
        )}
      </Box>
    </Stack>
  );
}

export default LeadOrientationBand;
