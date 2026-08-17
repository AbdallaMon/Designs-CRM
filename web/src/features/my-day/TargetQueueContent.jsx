"use client";
// Supervisor drill-down body — the selected rep's REAL work, itemized and linked.
//   • SALES  → a flat, severity-sorted list of active/at-risk leads, each with issue chips
//              (overdue calls / stale / unsigned) and a link to the lead (calls tab when it
//              has overdue calls).
//   • DESIGNER → the rep's active stages (on-track included), each linking to the work stage.
// Fed by GET /my-day/users/:userId (the enriched drill-down). A rep with only healthy active
// leads now shows those leads ("On track") instead of an empty "All clear".
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { alpha, useTheme } from "@mui/material/styles";
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { FiPhone, FiClock, FiFileText } from "react-icons/fi";
import { getData } from "@/app/helpers/functions/getData.js";
import { SEVERITY_PALETTE } from "@/features/leads/cockpit/config/cockpitActions.jsx";
import { getMyDaySignalConfig } from "@/features/my-day/config/myDayCopy.jsx";
import { MY_DAY_FAMILIES } from "@dms/shared";

// Section a SALES lead links to, given its issues (calls tab when a call is overdue).
function salesHref(item) {
  return item.flags?.overdueCalls > 0
    ? `/dashboard/deals/${item.leadId}?tab=calls`
    : `/dashboard/deals/${item.leadId}`;
}

// The issue chips for one SALES lead row (empty issues → a single "On track" chip).
function SalesFlags({ flags }) {
  const chips = [];
  if (flags?.overdueCalls > 0) {
    chips.push(
      <Chip key="calls" size="small" color="error" icon={<FiPhone size={12} />}
        label={`${flags.overdueCalls} overdue call${flags.overdueCalls > 1 ? "s" : ""}`} />,
    );
  }
  if (flags?.stale) {
    chips.push(<Chip key="stale" size="small" color="warning" icon={<FiClock size={12} />} label="Stale" />);
  }
  if (flags?.unsigned) {
    chips.push(<Chip key="unsigned" size="small" color="warning" icon={<FiFileText size={12} />} label="Unsigned contract" />);
  }
  if (!chips.length) {
    chips.push(<Chip key="ok" size="small" color="success" variant="outlined" label="On track" />);
  }
  return (
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
      {chips}
    </Stack>
  );
}

function SalesRow({ item, highlight, theme }) {
  const paletteKey = SEVERITY_PALETTE[item.severity] || "info";
  const color = theme.palette[paletteKey].main;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        borderLeft: `3px solid ${color}`,
        bgcolor: highlight ? alpha(color, 0.1) : alpha(color, 0.04),
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {item.clientName || `Lead #${item.leadId}`}
          </Typography>
          {item.status && <Chip size="small" label={item.status} variant="outlined" />}
        </Stack>
        <SalesFlags flags={item.flags} />
      </Box>
      <Button component={Link} href={salesHref(item)} size="small" variant="outlined" sx={{ flexShrink: 0 }}>
        Open
      </Button>
    </Box>
  );
}

function DesignerRow({ item, theme }) {
  const top = item.signals[0];
  const paletteKey = top ? SEVERITY_PALETTE[top.severity] || "info" : "info";
  const color = theme.palette[paletteKey].main;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        borderLeft: `3px solid ${color}`,
        bgcolor: alpha(color, 0.04),
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {item.clientName || `Lead #${item.leadId}`}
          </Typography>
          {item.level && <Chip size="small" label={item.level} variant="outlined" />}
        </Stack>
        {item.signals.length ? (
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
            {item.signals.map((s, i) => {
              const cfg = getMyDaySignalConfig(s.type);
              if (!cfg) return null;
              return (
                <Chip
                  key={i}
                  size="small"
                  color={SEVERITY_PALETTE[s.severity] || "default"}
                  variant={i === 0 ? "filled" : "outlined"}
                  label={`${cfg.title(s.params)} — ${cfg.description(s.params)}`}
                  sx={{ maxWidth: "100%" }}
                />
              );
            })}
          </Stack>
        ) : (
          <Chip size="small" color="success" variant="outlined" label="On track" />
        )}
      </Box>
      <Button component={Link} href={`/dashboard/work-stages/${item.leadId}`} size="small" variant="outlined" sx={{ flexShrink: 0 }}>
        Open work stage
      </Button>
    </Box>
  );
}

// A one-line summary of the SALES counts (e.g. "5 active · 2 overdue calls · 1 stale").
function CountsSummary({ counts }) {
  if (!counts) return null;
  const parts = [`${counts.active ?? 0} active`];
  if (counts.overdueCalls) parts.push(`${counts.overdueCalls} overdue call${counts.overdueCalls > 1 ? "s" : ""}`);
  if (counts.stale) parts.push(`${counts.stale} stale`);
  if (counts.unsigned) parts.push(`${counts.unsigned} unsigned`);
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
      {parts.join(" · ")}
    </Typography>
  );
}

export default function TargetQueueContent({ userId, focus }) {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const focusRef = useRef(null);

  const fetchQueue = useCallback(async () => {
    setError(false);
    const res = await getData({ url: `my-day/users/${userId}`, setLoading });
    if (res && res.status === 200) setData(res.data);
    else setError(true);
  }, [userId]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Scroll the first matching (focused) row into view once loaded.
  useEffect(() => {
    if (data && focus && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [data, focus]);

  if (loading) {
    return (
      <Stack spacing={1.5}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} />
        ))}
      </Stack>
    );
  }
  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchQueue}>Retry</Button>}>
        Couldn&apos;t load the queue.
      </Alert>
    );
  }
  if (!data?.items?.length) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.success.main }}>
          Nothing active — this person has no open work right now.
        </Typography>
      </Box>
    );
  }

  const isSales = data.family === MY_DAY_FAMILIES.SALES;
  // Which row to scroll to for a given focus: first overdue-call row / first stale row.
  const focusMatch = (item) => {
    if (focus === "overdue") return item.flags?.overdueCalls > 0;
    if (focus === "stale") return item.flags?.stale;
    return false;
  };
  let focusAssigned = false;

  return (
    <Stack spacing={1.5}>
      {isSales && <CountsSummary counts={data.counts} />}
      {data.items.map((item) => {
        const highlight = isSales && focusMatch(item);
        const attachRef = highlight && !focusAssigned;
        if (attachRef) focusAssigned = true;
        return (
          <Box key={isSales ? item.leadId : `${item.projectId}-${item.leadId}`} ref={attachRef ? focusRef : null}>
            {isSales ? (
              <SalesRow item={item} highlight={highlight} theme={theme} />
            ) : (
              <DesignerRow item={item} theme={theme} />
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
