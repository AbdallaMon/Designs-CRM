"use client";

// LeadsMonthlyOverviewSingle — binds to GET /v2/dashboard/leads-monthly-overview.
// Response .data shape (getLeadsMonthlyOverview):
//   { period: { start, end, label }, totals: { totalThisPeriod, insideCount, outsideCount,
//       incompleteCount, finalizedTotal, successRate },
//     inside:  { rows: [{ emirate, leads, finalized, successRate }] },
//     outside: { rows: [{ country, leads, finalized, successRate }] },
//     finalizedInsideRows:  [{ emirate, finalized }],
//     finalizedOutsideRows: [{ country, finalized }],
//     discoverySources: [{ source, count }] }
// A month picker drives ?startDate&endDate (the BE self-scopes staffId by token, so we send
// no staffId). The web/ useRequest re-fetches when the URL (with the date range baked in)
// changes. Mirrors the legacy LeadsMonthlyOverviewSingle layout, Arabic.

import { useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  LinearProgress,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  FaCheckCircle,
  FaGlobe,
  FaMapMarkedAlt,
  FaUserClock,
  FaUsers,
} from "react-icons/fa";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import dayjs from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { COLORS } from "@/app/helpers/colors.js";
import { LEAD_SOURCE_LABELS } from "@/app/helpers/constants.js";
import { useRequest } from "@/app/v2/hooks/useRequest";
import { LEADS_MONTHLY_OVERVIEW_URL } from "../config/constant.js";

const EMIRATE_AR = {
  DUBAI: "دبي",
  ABU_DHABI: "أبوظبي",
  SHARJAH: "الشارقة",
  AJMAN: "عجمان",
  UMM_AL_QUWAIN: "أم القيوين",
  RAS_AL_KHAIMAH: "رأس الخيمة",
  FUJAIRAH: "الفجيرة",
  KHOR_FAKKAN: "خورفكان",
};
const arEmirate = (e) => EMIRATE_AR[e] || String(e || "").replace(/_/g, " ");

const DEFAULT_PAYLOAD = {
  totals: { totalThisPeriod: 0, insideCount: 0, outsideCount: 0, incompleteCount: 0, finalizedTotal: 0, successRate: 0 },
  inside: { rows: [] },
  outside: { rows: [] },
  finalizedInsideRows: [],
  finalizedOutsideRows: [],
  discoverySources: [],
  period: { label: "هذا الشهر" },
};

export function LeadsMonthlyOverviewSingle({ enabled = true }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [hotTab, setHotTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const startDate = useMemo(() => selectedMonth.startOf("month").format("YYYY-MM-DD"), [selectedMonth]);
  const endDate = useMemo(() => selectedMonth.endOf("month").format("YYYY-MM-DD"), [selectedMonth]);

  // Bake the date range into the URL so useRequest re-fetches when the month changes.
  const url = `${LEADS_MONTHLY_OVERVIEW_URL}?startDate=${startDate}&endDate=${endDate}`;
  const { data, isLoading } = useRequest({ url, method: "get", autoFetch: enabled });

  const payload = { ...DEFAULT_PAYLOAD, ...(data || {}) };
  const { totals, inside, outside, discoverySources, period, finalizedInsideRows, finalizedOutsideRows } = payload;

  const sourcesData = useMemo(() => {
    const counts = Object.fromEntries((discoverySources || []).map((r) => [r.source || "OTHER", Number(r.count || 0)]));
    const allKeys = Object.keys(LEAD_SOURCE_LABELS);
    (discoverySources || []).forEach((r) => {
      const key = r.source || "OTHER";
      if (!allKeys.includes(key)) allKeys.push(key);
    });
    return allKeys
      .map((key) => ({ key, source: LEAD_SOURCE_LABELS[key]?.ar || key, count: counts[key] || 0 }))
      .sort((a, b) => b.count - a.count);
  }, [discoverySources]);

  const finalizedInsideData = useMemo(() => {
    const total = (finalizedInsideRows || []).reduce((s, r) => s + (r.finalized || 0), 0);
    return (finalizedInsideRows || []).map((r) => ({
      name: arEmirate(r.emirate),
      finalized: r.finalized || 0,
      percent: total ? Math.round((r.finalized * 100) / total) : 0,
    }));
  }, [finalizedInsideRows]);

  const finalizedOutsideData = useMemo(() => {
    const total = (finalizedOutsideRows || []).reduce((s, r) => s + (r.finalized || 0), 0);
    return (finalizedOutsideRows || []).map((r) => ({
      name: r.country || "غير معروف",
      finalized: r.finalized || 0,
      percent: total ? Math.round((r.finalized * 100) / total) : 0,
    }));
  }, [finalizedOutsideRows]);

  const activeData = hotTab === 0 ? finalizedInsideData : finalizedOutsideData;
  const firstColLabel = hotTab === 0 ? "الإمارة" : "الدولة";
  const chartHeight = Math.min(480, 40 * (activeData.length || 1) + 80);

  const topCards = [
    { title: `العملاء (${period?.label || "هذا الشهر"})`, value: totals?.totalThisPeriod ?? 0, icon: <FaUsers /> },
    { title: "داخل الإمارات", value: totals?.insideCount ?? 0, icon: <FaMapMarkedAlt /> },
    { title: "خارج الإمارات", value: totals?.outsideCount ?? 0, icon: <FaGlobe /> },
    { title: "غير مكتمل (بدون إمارة)", value: totals?.incompleteCount ?? 0, icon: <FaUserClock /> },
    { title: "مُبرمون", value: totals?.finalizedTotal ?? 0, icon: <FaCheckCircle /> },
  ];

  const onPrevMonth = () => setSelectedMonth((m) => m.subtract(1, "month"));
  const onNextMonth = () => setSelectedMonth((m) => m.add(1, "month"));

  return (
    <Box>
      {/* month selector */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2, gap: 1 }}>
        <IconButton onClick={onPrevMonth} size="small"><MdChevronRight /></IconButton>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            views={["year", "month"]}
            openTo="month"
            label="الشهر"
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val || dayjs())}
            slotProps={{ textField: { size: "small", sx: { minWidth: 180, textAlign: "center" } } }}
          />
        </LocalizationProvider>
        <IconButton onClick={onNextMonth} size="small"><MdChevronLeft /></IconButton>
      </Box>

      {/* summary cards */}
      <Grid container spacing={2}>
        {topCards.map((it, idx) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
            <Card sx={{ position: "relative" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar>{it.icon}</Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{it.title}</Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>{it.value}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* inside created */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {isLoading && <LoadingBar />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>داخل الإمارات حسب الإمارة (المُنشأة)</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الإمارة</TableCell>
                    <TableCell align="left">العملاء</TableCell>
                    <TableCell align="left">المُبرمون</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inside?.rows?.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{arEmirate(r.emirate)}</TableCell>
                      <TableCell align="left">{r.leads}</TableCell>
                      <TableCell align="left">{r.finalized}</TableCell>
                    </TableRow>
                  ))}
                  {(!inside?.rows || inside.rows.length === 0) && (
                    <TableRow><TableCell colSpan={3}>لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* outside created */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {isLoading && <LoadingBar />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>خارج الإمارات حسب الدولة (المُنشأة)</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الدولة</TableCell>
                    <TableCell align="left">العملاء</TableCell>
                    <TableCell align="left">المُبرمون</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {outside?.rows?.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.country || "غير معروف"}</TableCell>
                      <TableCell align="left">{r.leads}</TableCell>
                      <TableCell align="left">{r.finalized}</TableCell>
                    </TableRow>
                  ))}
                  {(!outside?.rows || outside.rows.length === 0) && (
                    <TableRow><TableCell colSpan={3}>لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* finalized hotspots */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {isLoading && <LoadingBar />}
            <CardContent sx={{ overflowX: "auto" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>أعلى مناطق الإبرام (حسب تاريخ الإبرام)</Typography>
              <Tabs value={hotTab} onChange={(_, v) => setHotTab(v)} variant="fullWidth" sx={{ mb: 1 }}>
                <Tab label="داخل الإمارات" />
                <Tab label="خارج الإمارات" />
              </Tabs>
              {activeData.length === 0 ? (
                <Box sx={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Typography color="text.secondary">لا توجد بيانات</Typography>
                </Box>
              ) : (
                <Box sx={{ height: chartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activeData} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={isMobile ? 80 : 110} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="finalized" name="المُبرمون">
                        {activeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{firstColLabel}</TableCell>
                    <TableCell align="left">المُبرمون</TableCell>
                    <TableCell align="left" sx={{ width: 200 }}>%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeData.length === 0 && (
                    <TableRow><TableCell colSpan={4}>لا توجد بيانات</TableCell></TableRow>
                  )}
                  {activeData.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{r.name}</TableCell>
                      <TableCell align="left">{r.finalized}</TableCell>
                      <TableCell align="left">
                        {r.percent}%
                        <LinearProgress variant="determinate" value={r.percent} sx={{ height: 6, borderRadius: 6, mt: 0.5 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* discovery sources */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {isLoading && <LoadingBar />}
            <CardContent sx={{ overflowX: "auto" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>مصادر التعرف علينا</Typography>
              <Box sx={{ height: isMobile ? 300 : 340 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth="380px">
                  <BarChart data={sourcesData} margin={{ top: 16, right: isMobile ? 16 : 24, left: 0, bottom: isMobile ? 60 : 24 }}>
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
                      {sourcesData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              <Table size="small" sx={{ mt: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>المصدر</TableCell>
                    <TableCell align="left">عدد العملاء</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sourcesData.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.source}</TableCell>
                      <TableCell align="left">{r.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* finalized inside (by emirate) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {isLoading && <LoadingBar />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>المُبرمون داخل الإمارات (حسب الإمارة)</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الإمارة</TableCell>
                    <TableCell align="left">المُبرمون</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finalizedInsideRows?.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{arEmirate(r.emirate)}</TableCell>
                      <TableCell align="left">{r.finalized}</TableCell>
                    </TableRow>
                  ))}
                  {(!finalizedInsideRows || finalizedInsideRows.length === 0) && (
                    <TableRow><TableCell colSpan={2}>لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* finalized outside (by country) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", position: "relative" }}>
            {isLoading && <LoadingBar />}
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>المُبرمون خارج الإمارات (حسب الدولة)</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>الدولة</TableCell>
                    <TableCell align="left">المُبرمون</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finalizedOutsideRows?.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.country || "غير معروف"}</TableCell>
                      <TableCell align="left">{r.finalized}</TableCell>
                    </TableRow>
                  ))}
                  {(!finalizedOutsideRows || finalizedOutsideRows.length === 0) && (
                    <TableRow><TableCell colSpan={2}>لا توجد بيانات</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function LoadingBar() {
  return <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />;
}

export default LeadsMonthlyOverviewSingle;
