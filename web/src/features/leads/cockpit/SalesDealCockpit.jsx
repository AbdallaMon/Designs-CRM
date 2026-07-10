"use client";
// SalesDealCockpit — the "next-best-action" strip on the deal-detail screen.
//
// Sits between the deal header and the workspace. It answers "what do I do next on this
// deal?" by rendering, from the backend cockpit endpoint (loaded lazily + cached via
// `useLeadTab("cockpit")`):
//   • a DealHealthBar (stage progress + status/payment chips), and
//   • a PRIORITIZED action list (critical → warning → info; the backend pre-sorts it),
//     each row carrying a one-click CTA that REUSES the existing action dialog.
//
// Gating: every CTA is capability-gated by the `capabilities` the cockpit response carries
// — identical predicate to the tab actions. A view-only action (`cta.capability === null`)
// always shows its nav CTA; an action whose capability the user lacks shows the SIGNAL but
// no button ("signal visible, action gated").
//
// After any mutating CTA succeeds we silently refetch the cockpit + core lead (and the
// relevant tab) so the strip and header reflect the change without a full reload.
import { useState } from "react";
import { Box, Button, Stack, Typography, alpha, useTheme } from "@mui/material";
import { MdCheckCircleOutline } from "react-icons/md";
import {
  useLeadDetails,
  useLeadTab,
} from "@/features/leads/context/LeadDetailsContext.jsx";
import { StatusMenu } from "@/features/leads/shared/StatusMenu.jsx";
import { NewCallDialog } from "@/features/leads/dialogs/CallsDialog.jsx";
import { NewClientMeetingDialog } from "@/features/leads/dialogs/MeetingsDialog.jsx";
import { AddPriceOffers } from "@/features/leads/dialogs/PriceOffersDialog.jsx";
import AddPayments from "@/features/leads/payments/AddPayments.jsx";
import { DealHealthBar } from "@/features/leads/cockpit/DealHealthBar.jsx";
import {
  getActionConfig,
  GOTO_SECTION,
  SEVERITY_PALETTE,
} from "@/features/leads/cockpit/config/cockpitActions.jsx";

// Inner label for a dialog-triggered CTA (the dialog wraps this in its own OpenButton).
function CtaText({ children, color }) {
  return (
    <Box
      component="span"
      sx={{ color, fontWeight: 700, fontSize: "0.8125rem", whiteSpace: "nowrap" }}
    >
      {children}
    </Box>
  );
}

// A self-rendered severity-colored CTA (status menu / goto-tab).
function CtaButton({ children, color, onClick }) {
  return (
    <Button
      size="small"
      variant="outlined"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontWeight: 700,
        borderRadius: 2,
        whiteSpace: "nowrap",
        color,
        borderColor: alpha(color, 0.5),
        "&:hover": { borderColor: color, bgcolor: alpha(color, 0.08) },
      }}
    >
      {children}
    </Button>
  );
}

export function SalesDealCockpit({ lead, ctx, onGoToTab, statuses, onStatusChange }) {
  const theme = useTheme();
  const details = useLeadDetails();
  const { data, showLoading, error, refetch } = useLeadTab("cockpit");
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [payOpen, setPayOpen] = useState(false);

  // useLeadTab returns [] when the cache is still empty; the cockpit payload is an OBJECT.
  const cockpit = data && !Array.isArray(data) ? data : null;

  // On a successful mutation: silently reconcile the cockpit + header (and the affected
  // tab). The existing dialogs invoke their `setXxx` prop with an updater on success — we
  // pass THIS in that slot and ignore the updater, using the call itself as the signal.
  const refresh = (tabKey) => () => {
    details?.refetchTab?.("cockpit", { silent: true });
    details?.refetchCore?.();
    if (tabKey) details?.refetchTab?.(tabKey, { silent: true });
    details?.refreshKanban?.();
  };

  const handleStatusChange = async (value) => {
    setStatusAnchor(null);
    // Reuse LeadContent's exact status handler (POST / finalize / setLead / kanban)…
    if (onStatusChange) await onStatusChange(value);
    // …then reconcile the cockpit + header so the strip reflects the new status.
    details?.refetchTab?.("cockpit", { silent: true });
    details?.refetchCore?.();
  };

  if (showLoading) {
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <Box
          sx={{
            height: 72,
            borderRadius: 2.5,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.4),
          }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Couldn&apos;t load the deal cockpit.
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => refetch()}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Retry
          </Button>
        </Stack>
      </Box>
    );
  }

  if (!cockpit) return null;

  const { health, actions = [], capabilities = {} } = cockpit;
  // Server-computed: a terminal (closed) deal shows the "closed" empty-state copy.
  const isTerminal = Boolean(health?.isTerminal);

  const renderCta = (action, color) => {
    const cfg = getActionConfig(action.type);
    if (!cfg) return null;
    const kind = action.cta?.kind;
    switch (kind) {
      case "OPEN_CALL":
        return (
          <NewCallDialog
            lead={lead}
            setleads={ctx?.setleads}
            setCallReminders={refresh("calls")}
            type="component"
          >
            <CtaText color={color}>{cfg.ctaLabel}</CtaText>
          </NewCallDialog>
        );
      case "OPEN_MEETING":
        return (
          <NewClientMeetingDialog
            lead={lead}
            setleads={ctx?.setleads}
            setMeetingReminders={refresh("meetings")}
            type="component"
          >
            <CtaText color={color}>{cfg.ctaLabel}</CtaText>
          </NewClientMeetingDialog>
        );
      case "OPEN_PRICE_OFFER":
        return (
          <AddPriceOffers
            lead={lead}
            setPriceOffers={refresh("priceOffers")}
            type="component"
          >
            <CtaText color={color}>{cfg.ctaLabel}</CtaText>
          </AddPriceOffers>
        );
      case "OPEN_PAYMENT":
        return (
          <AddPayments
            lead={lead}
            open={payOpen}
            setOpen={setPayOpen}
            paymentType="final-price"
            totalAmount={lead.averagePrice}
            setOldPayments={refresh()}
          />
        );
      case "OPEN_STATUS":
        return (
          <>
            <CtaButton
              color={color}
              onClick={(e) => setStatusAnchor(e.currentTarget)}
            >
              {cfg.ctaLabel}
            </CtaButton>
            <StatusMenu
              open={Boolean(statusAnchor)}
              anchorEl={statusAnchor}
              onClose={() => setStatusAnchor(null)}
              statuses={statuses || []}
              onStatusChange={handleStatusChange}
              theme={theme}
            />
          </>
        );
      case "GOTO_TAB":
        return (
          <CtaButton
            color={color}
            onClick={() =>
              onGoToTab?.(GOTO_SECTION[action.cta.tabKey] || action.cta.tabKey)
            }
          >
            {cfg.ctaLabel}
          </CtaButton>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Stack spacing={2}>
        <DealHealthBar health={health} />

        {actions.length === 0 ? (
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.success.main, 0.35)}`,
              bgcolor: alpha(theme.palette.success.main, 0.08),
            }}
          >
            <MdCheckCircleOutline
              size={20}
              color={theme.palette.success.main}
            />
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {isTerminal
                ? "This deal is closed — nothing to action."
                : "You're all caught up on this deal."}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={1.25}>
            {actions.map((action, i) => {
              const cfg = getActionConfig(action.type);
              if (!cfg) return null;
              const paletteKey = SEVERITY_PALETTE[action.severity] || "info";
              const color = theme.palette[paletteKey].main;
              // cta.capability === null → view-only nav (always show). Otherwise the CTA
              // shows only when the backend granted the matching capability.
              const canDo =
                action.cta?.capability == null
                  ? true
                  : Boolean(capabilities[action.cta.capability]);
              return (
                <Box
                  key={`${action.type}-${i}`}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    p: 1.25,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: `3px solid ${color}`,
                    bgcolor: alpha(color, 0.04),
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 19,
                      color,
                      bgcolor: alpha(color, 0.14),
                    }}
                  >
                    {cfg.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="text.primary"
                      noWrap
                    >
                      {cfg.title(action.params)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cfg.description(action.params)}
                    </Typography>
                  </Box>
                  {canDo && (
                    <Box sx={{ flexShrink: 0 }}>{renderCta(action, color)}</Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export default SalesDealCockpit;
