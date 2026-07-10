// components/LeadsMonthlyOverviewSingle.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Avatar,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import {
  FaUsers,
  FaMapMarkedAlt,
  FaGlobe,
  FaUserClock,
  FaCheckCircle,
  FaPercent,
} from "react-icons/fa";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

import { Tabs, Tab } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

import LoadingOverlay from "@/shared/components/feedback/loaders/LoadingOverlay.jsx";
import LeadsCreatedByRegionTable from "@/features/dashboard/LeadsCreatedByRegionTable.jsx";
import LeadsFinalizedByRegionTable from "@/features/dashboard/LeadsFinalizedByRegionTable.jsx";
import FinalizedHotspotsTable from "@/features/dashboard/FinalizedHotspotsTable.jsx";
import DiscoverySourcesTable from "@/features/dashboard/DiscoverySourcesTable.jsx";
import { getData } from "@/app/helpers/functions/getData.js";
import { COLORS } from "@/app/helpers/colors.js";
import { LEAD_SOURCE_LABELS } from "@/app/helpers/constants";
import dayjs from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const DEFAULT_PAYLOAD = {
  totals: {
    totalThisPeriod: 0,
    insideCount: 0,
    outsideCount: 0,
    incompleteCount: 0,
    finalizedTotal: 0,
    successRate: 0,
  },
  // leads created in period
  inside: { rows: [], topFinalized: null },
  outside: { rows: [], topFinalized: null },
  // finalized-only breakdown (by finalizedDate)
  finalizedInsideRows: [], // [{ emirate, finalized }]
  finalizedOutsideRows: [], // [{ country, finalized }]
  // discovery
  discoverySources: [],
  period: { label: "This Month" },
};

const LeadsMonthlyOverviewSingle = ({ staffId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [hotTab, setHotTab] = useState(0);
  // شهر مختار (افتراضي الشهر الحالي)
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const {
    totals,
    inside,
    outside,
    discoverySources,
    period,
    finalizedInsideRows,
    finalizedOutsideRows,
  } = payload;

  const startDate = useMemo(
    () => selectedMonth.startOf("month").format("YYYY-MM-DD"),
    [selectedMonth]
  );
  const endDate = useMemo(
    () => selectedMonth.endOf("month").format("YYYY-MM-DD"),
    [selectedMonth]
  );

  useEffect(() => {
    async function fetchData() {
      const params = new URLSearchParams();
      if (staffId) params.set("staffId", staffId);
      params.set("startDate", startDate);
      params.set("endDate", endDate);

      const res = await getData({
        url: `shared/dashboard/leads-monthly-overview?${params.toString()}&`,
        setLoading,
      });
      if (res) setPayload(res.data || DEFAULT_PAYLOAD);
    }
    fetchData();
  }, [staffId, startDate, endDate]);

  const sourcesData = useMemo(() => {
    const allKeys = Object.keys(LEAD_SOURCE_LABELS);
    const counts = Object.fromEntries(
      (discoverySources || []).map((r) => [
        r.source || "OTHER",
        Number(r.count || 0),
      ])
    );
    (discoverySources || []).forEach((r) => {
      const key = r.source || "OTHER";
      if (!allKeys.includes(key)) allKeys.push(key);
    });
    const rows = allKeys.map((key) => ({
      key,
      source: LEAD_SOURCE_LABELS[key]?.ar || key,
      count: counts[key] || 0,
    }));
    rows.sort((a, b) => b.count - a.count);
    return rows;
  }, [discoverySources]);

  const topCards = [
    {
      title: `Leads (${period?.label})`,
      value: totals?.totalThisPeriod ?? 0,
      icon: <FaUsers />,
    },
    {
      title: "Inside UAE",
      value: totals?.insideCount ?? 0,
      icon: <FaMapMarkedAlt />,
    },
    {
      title: "Outside UAE",
      value: totals?.outsideCount ?? 0,
      icon: <FaGlobe />,
    },
    {
      title: "Incomplete (no emirate)",
      value: totals?.incompleteCount ?? 0,
      icon: <FaUserClock />,
    },
    {
      title: "Finalized",
      value: totals?.finalizedTotal ?? 0,
      icon: <FaCheckCircle />,
    },
  ];

  const onPrevMonth = () => setSelectedMonth((m) => m.subtract(1, "month"));
  const onNextMonth = () => setSelectedMonth((m) => m.add(1, "month"));

  const finalizedInsideData = useMemo(() => {
    const total = (finalizedInsideRows || []).reduce(
      (s, r) => s + (r.finalized || 0),
      0
    );
    return (finalizedInsideRows || []).map((r) => ({
      name: r.emirate,
      finalized: r.finalized || 0,
      percent: total ? Math.round((r.finalized * 100) / total) : 0,
    }));
  }, [finalizedInsideRows]);

  const finalizedOutsideData = useMemo(() => {
    const total = (finalizedOutsideRows || []).reduce(
      (s, r) => s + (r.finalized || 0),
      0
    );
    return (finalizedOutsideRows || []).map((r) => ({
      name: r.country,
      finalized: r.finalized || 0,
      percent: total ? Math.round((r.finalized * 100) / total) : 0,
    }));
  }, [finalizedOutsideRows]);

  const activeData = hotTab === 0 ? finalizedInsideData : finalizedOutsideData;
  const firstColLabel = hotTab === 0 ? "Emirate" : "Country";
  const chartHeight = Math.min(480, 40 * (activeData.length || 1) + 80);

  return (
    <Box>
      {/* اختيار الشهر (أعلى المنتصف) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          gap: 1,
        }}
      >
        <IconButton onClick={onPrevMonth} size="small">
          <MdChevronLeft />
        </IconButton>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            views={["year", "month"]}
            openTo="month"
            label="الشهر"
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val || dayjs())}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 180, textAlign: "center" },
              },
            }}
          />
        </LocalizationProvider>
        <IconButton onClick={onNextMonth} size="small">
          <MdChevronRight />
        </IconButton>
      </Box>

      {/* كروت الملخص */}
      <Grid container spacing={2}>
        {topCards.map((it, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
            <Card>
              <CardContent
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Avatar>{it.icon}</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    {it.title}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {it.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* جداول الإنشاء داخل/خارج */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {loading && <LoadingOverlay />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                Inside UAE by Emirate (Created)
              </Typography>
              <LeadsCreatedByRegionTable
                firstColLabel="Emirate"
                firstColKey="emirate"
                rows={inside?.rows}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {loading && <LoadingOverlay />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                Outside UAE by Country (Created)
              </Typography>
              <LeadsCreatedByRegionTable
                firstColLabel="Country"
                firstColKey="country"
                rows={outside?.rows}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Finalized Hotspots (من finalized-only) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {loading && <LoadingOverlay />}
            <CardContent sx={{ overflowX: "auto" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                Finalized Hotspots (by Finalized Date)
              </Typography>

              <Tabs
                value={hotTab}
                onChange={(_, v) => setHotTab(v)}
                variant="fullWidth"
                sx={{ mb: 1 }}
              >
                <Tab label="Inside UAE" />
                <Tab label="Outside UAE" />
              </Tabs>

              {/* Chart */}
              <Box sx={{ height: chartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeData}
                    layout="vertical"
                    margin={{ top: 8, right: 20, bottom: 8, left: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={isMobile ? 80 : 110}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="finalized" name="Finalized">
                      {activeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Table */}
              <FinalizedHotspotsTable
                activeData={activeData}
                firstColLabel={firstColLabel}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* مصادر التعرف علينا: Bar + جدول */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {loading && <LoadingOverlay />}
            <CardContent sx={{ overflowX: "auto" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                مصادر التعرف علينا
              </Typography>

              <Box sx={{ height: isMobile ? 300 : 340 }}>
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth="380px"
                >
                  <BarChart
                    data={sourcesData}
                    margin={{
                      top: 16,
                      right: isMobile ? 16 : 24,
                      left: 0,
                      bottom: isMobile ? 60 : 24,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="source"
                      interval={0}
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 60 : 30}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={24} />
                    <Bar dataKey="count" name="عدد العملاء">
                      {sourcesData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <DiscoverySourcesTable sourcesData={sourcesData} />
            </CardContent>
          </Card>
        </Grid>

        {/* جداول Finalized منفصلة */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {loading && <LoadingOverlay />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                Finalized Inside UAE (by Emirate)
              </Typography>
              <LeadsFinalizedByRegionTable
                firstColLabel="Emirate"
                firstColKey="emirate"
                rows={finalizedInsideRows}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {loading && <LoadingOverlay />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                Finalized Outside UAE (by Country)
              </Typography>
              <LeadsFinalizedByRegionTable
                firstColLabel="Country"
                firstColKey="country"
                rows={finalizedOutsideRows}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LeadsMonthlyOverviewSingle;
