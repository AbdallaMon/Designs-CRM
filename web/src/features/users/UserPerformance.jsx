"use client";

import { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  FiActivity,
  FiAward,
  FiCheckCircle,
  FiClock,
  FiCircle,
  FiDollarSign,
  FiInbox,
  FiLayers,
  FiMaximize2,
  FiPauseCircle,
  FiPercent,
  FiPlayCircle,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

import { getData } from "@/app/helpers/functions/getData";
import { familiesOf, FAMILY_META } from "@/app/helpers/profiles";
import LeadStatusChart from "@/features/dashboard/LeadStatusChart.jsx";
import IncomeOverTimeChart from "@/features/dashboard/IncomeOverTimeChart.jsx";

const nf = new Intl.NumberFormat("en-US");
const fmtNum = (n) => nf.format(Number(n || 0));
const fmtMoney = (n) => `${nf.format(Math.round(Number(n || 0)))} AED`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

// A single KPI tile — the building block that gives this page its own look (distinct from
// the main dashboard's chart-heavy cards).
function StatTile({ icon, label, value, sub, tint = "primary" }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        border: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (t) => alpha(t.palette[tint].main, 0.12),
              color: (t) => t.palette[tint].main,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2 }}
          >
            {label}
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight={800} color="text.primary" noWrap>
          {value}
        </Typography>
        {sub != null && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
          color: "primary.main",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={800} color="text.primary">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

const TILE_SIZE = { xs: 6, sm: 4, md: 3 };

function SalesSection({ metrics, staffId }) {
  const m = metrics || {};
  return (
    <Box>
      <SectionHeader
        icon={<FiTarget size={20} />}
        title="Sales"
        subtitle="Leads, conversion and revenue for this user"
      />
      <Grid container spacing={2}>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiDollarSign size={18} />} tint="success" label="Revenue" value={fmtMoney(m.totalRevenue)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiAward size={18} />} tint="primary" label="Commission" value={fmtMoney(m.totalCommission)} sub={`Cleared: ${fmtMoney(m.totalClreadCommission)}`} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiTrendingUp size={18} />} tint="info" label="Avg deal value" value={fmtMoney(m.averageProjectValue)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiPercent size={18} />} tint="warning" label="Success rate" value={fmtPct(m.successRate)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiUsers size={18} />} tint="info" label="Total leads" value={fmtNum(m.leadsCounts)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiActivity size={18} />} tint="primary" label="Interacted" value={fmtNum(m.interactedLeads)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiCheckCircle size={18} />} tint="success" label="Won" value={fmtNum(m.successLeadsCount ?? m.convertedLeadCounts)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiInbox size={18} />} tint="warning" label="On hold" value={fmtNum(m.onHoldLeadCounts)} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <LeadStatusChart staff={false} staffId={staffId} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <IncomeOverTimeChart staff={false} staffId={staffId} />
        </Grid>
      </Grid>
    </Box>
  );
}

function DesignSection({ metrics }) {
  const m = metrics || {};
  return (
    <Box>
      <SectionHeader
        icon={<FiLayers size={20} />}
        title="Design"
        subtitle="Projects, area and time delivered by this user"
      />
      <Grid container spacing={2}>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiLayers size={18} />} tint="primary" label="Total projects" value={fmtNum(m.totalProjects)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiCheckCircle size={18} />} tint="success" label="Completed" value={fmtNum(m.completedProjects)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiPlayCircle size={18} />} tint="info" label="In progress" value={fmtNum(m.inProgressProject)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiPauseCircle size={18} />} tint="warning" label="On hold" value={fmtNum(m.holdProjects)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiCircle size={18} />} tint="error" label="Not started" value={fmtNum(m.notStartedProject)} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiMaximize2 size={18} />} tint="primary" label="Total area" value={`${fmtNum(m.totalArea)} m²`} sub={`This month: ${fmtNum(m.currentMonthArea)} m²`} />
        </Grid>
        <Grid size={TILE_SIZE}>
          <StatTile icon={<FiClock size={18} />} tint="info" label="Total time" value={fmtNum(m.totalTimeSpent)} sub={`This month: ${fmtNum(m.currentMonthTimeSpent)}`} />
        </Grid>
      </Grid>
    </Box>
  );
}

function UntrackedSection({ families }) {
  const names = families.map((f) => FAMILY_META[f]?.label ?? f).join(" & ");
  return (
    <Card
      elevation={0}
      sx={{ borderRadius: 3, border: (t) => `1px dashed ${t.palette.divider}` }}
    >
      <CardContent sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          No per-user performance is tracked for the {names} profile.
        </Typography>
      </CardContent>
    </Card>
  );
}

// Profile-aware per-user performance. Instead of branching on a single role, it renders one
// section per FAMILY the user belongs to across ALL their profiles (a user with Sales +
// Design profiles sees BOTH). Metrics come from the crash-safe staffId endpoints
// (key-metrics / designer-metrics) which return zeros for the wrong domain — never a 500.
export default function UserPerformance({ user }) {
  const families = useMemo(() => familiesOf(user), [user]);
  const isSales = families.includes("SALES");
  const isDesign = families.includes("DESIGN");
  const staffId = user?.id;

  const [salesMetrics, setSalesMetrics] = useState(null);
  const [designMetrics, setDesignMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const noop = () => {};
      const tasks = [];
      if (isSales) {
        tasks.push(
          getData({
            url: `dashboard/key-metrics?staffId=${staffId}&profile=true&`,
            setLoading: noop,
          }).then((r) => {
            if (active) setSalesMetrics(r?.data ?? null);
          }),
        );
      }
      if (isDesign) {
        tasks.push(
          getData({
            url: `dashboard/designer-metrics?staffId=${staffId}&profile=true&`,
            setLoading: noop,
          }).then((r) => {
            if (active) setDesignMetrics(r?.data ?? null);
          }),
        );
      }
      await Promise.all(tasks);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [staffId, isSales, isDesign]);

  if (loading) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const untracked = families.filter((f) => f !== "SALES" && f !== "DESIGN");

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 3 }}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Showing performance for:
        </Typography>
        {families.length ? (
          families.map((f) => (
            <Chip
              key={f}
              size="small"
              label={FAMILY_META[f]?.label ?? f}
              sx={{ fontWeight: 700, borderRadius: 1.5 }}
              color="primary"
              variant="outlined"
            />
          ))
        ) : (
          <Chip size="small" label="No profiles" sx={{ fontWeight: 700 }} />
        )}
      </Stack>

      <Stack spacing={4}>
        {isSales && <SalesSection metrics={salesMetrics} staffId={staffId} />}
        {isSales && isDesign && <Divider />}
        {isDesign && <DesignSection metrics={designMetrics} />}
        {untracked.length > 0 && <UntrackedSection families={untracked} />}
        {families.length === 0 && (
          <Card
            elevation={0}
            sx={{ borderRadius: 3, border: (t) => `1px dashed ${t.palette.divider}` }}
          >
            <CardContent sx={{ py: 5, textAlign: "center" }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                This user has no profiles to report on yet.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
