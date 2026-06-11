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
// so the user knows the data exists. A visible card the user can open shows "0 / لا يوجد"
// when its count is zero. Single Arabic / RTL; theme tokens only.

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
import { locateSection } from "../config/leadHubTabs.js";

// The rail's cards, in order. `count` is read off the lead payload (a function, so a missing
// path yields undefined → no number). `sectionKey` ties the card to a tab via leadHubTabs.
const RAIL_CARDS = [
  { sectionKey: "projects", label: "المشاريع", icon: <MdWork />, count: () => undefined },
  { sectionKey: "contracts", label: "العقود", icon: <MdDescription />, count: () => undefined },
  { sectionKey: "sessions", label: "جلسات الصور", icon: <MdImage />, count: () => undefined },
  { sectionKey: "payments", label: "الدفعات", icon: <MdPayments />, count: (lead) => lead?.payments?.length },
  { sectionKey: "calls", label: "المكالمات", icon: <MdCall />, count: (lead) => lead?.callReminders?.length },
  { sectionKey: "meetings", label: "الاجتماعات", icon: <MdGroups />, count: (lead) => lead?.meetingReminders?.length },
];

function RailCard({ card, lead, allowed, onNavigate }) {
  const loc = locateSection(card.sectionKey);
  const count = card.count(lead);
  const hasCount = typeof count === "number";

  // Partial-permission: render a disabled, explained chip — do NOT hide it.
  if (!allowed) {
    return (
      <Tooltip title="لا تملك صلاحية العرض">
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
            <CardInner icon={<MdLock />} label={card.label} valueNode={
              <Typography variant="caption" sx={{ color: "text.disabled" }}>محظور</Typography>
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
          label={card.label}
          valueNode={
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {hasCount ? (count > 0 ? count : "لا يوجد") : "—"}
            </Typography>
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
  if (!lead) return null;
  return (
    <Box
      role="navigation"
      aria-label="السجلات المرتبطة"
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
