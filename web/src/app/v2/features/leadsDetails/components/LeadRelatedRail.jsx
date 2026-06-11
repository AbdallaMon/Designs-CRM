"use client";

// <LeadRelatedRail> — a horizontally-scrollable row of compact count-cards for the lead's
// related records (المشاريع · العقود · جلسات الصور · الدفعات · المكالمات · الاجتماعات).
// Each card = icon + Arabic label + count; clicking it deep-links to the owning group/sub
// (resolved from leadHubTabs → onNavigate(groupKey, subKey)).
//
// COUNTS come ONLY from the lead detail payload (NO extra fetch). A section whose count is not
// in the payload renders WITHOUT a number (label + icon, still navigates). See the page report
// for the payload↔count coverage. Gating: a card the user CANNOT view is NOT hidden — it
// renders as a DISABLED chip with a "لا تملك صلاحية العرض" tooltip (partial-permission state),
// so the user knows the data exists. A visible card the user can open shows a muted numeral "0"
// when its count is zero, and a muted "—" with a "غير متاح" tooltip when the count is unknown
// (payload missing). Single Arabic / RTL; theme tokens only.

import { Box, Card, CardActionArea, Stack, Tooltip, Typography } from "@mui/material";
import {
  MdWork,
  MdDescription,
  MdImage,
  MdPayments,
  MdCall,
  MdGroups,
  MdLock,
} from "react-icons/md";
import { useT } from "@/app/v2/lib/i18n";
import { locateSection } from "../config/leadHubTabs.js";

// The rail's cards, in order. `count` is read off the lead payload (a function, so a missing
// path yields undefined → no number, rendering "—"). `sectionKey` ties the card to a tab via
// leadHubTabs.
//
// COUNT COVERAGE (lead detail payload):
//   payments / callReminders / meetingReminders → full arrays  ✅ real length.
//   projects / contracts / sessions (imageSessions) → the take:1 IN_PROGRESS `contracts`
//     include is NOT a reliable total, and projects/imageSessions are not embedded as arrays.
//     The backend now adds an additive `_count: { projects, contracts, imageSessions }` to the
//     lead detail (both admin + staff paths) — read true totals from there. Fall back to "—"
//     only when `_count` is genuinely absent (e.g. an older/cached payload).
const RAIL_CARDS = [
  { sectionKey: "projects", labelKey: "leadsDetails.rail.projects", icon: <MdWork />, count: (lead) => lead?._count?.projects },
  { sectionKey: "contracts", labelKey: "leadsDetails.rail.contracts", icon: <MdDescription />, count: (lead) => lead?._count?.contracts },
  { sectionKey: "sessions", labelKey: "leadsDetails.rail.sessions", icon: <MdImage />, count: (lead) => lead?._count?.imageSessions },
  { sectionKey: "payments", labelKey: "leadsDetails.rail.payments", icon: <MdPayments />, count: (lead) => lead?.payments?.length },
  { sectionKey: "calls", labelKey: "leadsDetails.rail.calls", icon: <MdCall />, count: (lead) => lead?.callReminders?.length },
  { sectionKey: "meetings", labelKey: "leadsDetails.rail.meetings", icon: <MdGroups />, count: (lead) => lead?.meetingReminders?.length },
];

function RailCard({ card, lead, allowed, onNavigate }) {
  const { t } = useT();
  const loc = locateSection(card.sectionKey);
  const count = card.count(lead);
  const hasCount = typeof count === "number";
  const label = t(card.labelKey);

  // Partial-permission: render a disabled, explained chip — do NOT hide it.
  if (!allowed) {
    return (
      <Tooltip title={t("leadsDetails.rail.denied.tooltip")}>
        <Card
          aria-disabled="true"
          sx={{
            minWidth: 140,
            flex: "0 0 auto",
            borderRadius: 3,
            bgcolor: "action.disabledBackground",
            opacity: 0.7,
          }}
        >
          <Box sx={{ p: 1.5 }}>
            <CardInner icon={<MdLock />} label={label} valueNode={
              <Typography variant="caption" sx={{ color: "text.disabled" }}>{t("leadsDetails.rail.denied.label")}</Typography>
            } muted />
          </Box>
        </Card>
      </Tooltip>
    );
  }

  return (
    <Card sx={{ minWidth: 140, flex: "0 0 auto", borderRadius: 3 }}>
      <CardActionArea
        onClick={() => loc && onNavigate(loc.groupKey, loc.subKey)}
        sx={{ p: 1.5, height: "100%" }}
      >
        <CardInner
          icon={card.icon}
          label={label}
          valueNode={
            hasCount ? (
              // A real count from the payload. Zero renders as a MUTED numeral "0" (M2) — a
              // crisp, scannable figure rather than the prose "لا يوجد", which read as noise in a
              // row of numbers.
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: count > 0 ? "text.primary" : "text.disabled",
                }}
              >
                {count}
              </Typography>
            ) : (
              // Count genuinely unknown (e.g. an older/cached payload missing `_count`): show a
              // muted em-dash with a "غير متاح" tooltip so the user knows it's unavailable, not zero.
              <Tooltip title={t("leadsDetails.rail.unavailable")}>
                <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2, color: "text.disabled" }}>
                  —
                </Typography>
              </Tooltip>
            )
          }
        />
      </CardActionArea>
    </Card>
  );
}

function CardInner({ icon, label, valueNode, muted = false }) {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box sx={{ display: "flex", fontSize: 20, color: muted ? "text.disabled" : "primary.main" }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
          {label}
        </Typography>
      </Stack>
      {valueNode}
    </Stack>
  );
}

export function LeadRelatedRail({ lead, gates, onNavigate }) {
  const { t } = useT();
  if (!lead) return null;
  return (
    <Box
      role="navigation"
      aria-label={t("leadsDetails.rail.navAria")}
      sx={{
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        pb: 1,
        mb: 2,
        // hide scrollbar chrome but keep scroll; theme-driven so no hardcoded greys
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: 6 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "divider", borderRadius: 3 },
      }}
    >
      {RAIL_CARDS.map((card) => {
        const loc = locateSection(card.sectionKey);
        const allowed = loc ? Boolean(gates?.[loc.gateKey]) : false;
        return (
          <RailCard
            key={card.sectionKey}
            card={card}
            lead={lead}
            allowed={allowed}
            onNavigate={onNavigate}
          />
        );
      })}
    </Box>
  );
}

export default LeadRelatedRail;
