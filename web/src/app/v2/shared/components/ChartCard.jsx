"use client";

// <ChartCard /> — a thin wrapper that renders a `@mui/x-charts` chart inside a themed
// <SectionCard>. Standardized chart lib for the v2 redesign (native MUI v7 fit; inherits the
// v2 theme + the existing emotion-RTL cache automatically). Phase 0 only establishes the lib +
// this wrapper — dashboards wire real series in a later phase. Placeholder data is fine here.
// Single-language Arabic / RTL.
//
// Props:
//   title     string?  — section heading (passed to SectionCard).
//   actions   node?    — header-end controls.
//   type      "bar" | "line" | "pie" (default "bar").
//   height    number   — chart height in px (default 280).
//   loading   bool?    — render a chart-shaped skeleton instead of the chart.
//   ...chartProps       — forwarded to the underlying x-charts component (series, xAxis, …).

import { Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { SectionCard } from "./SectionCard";
import { LoadingState } from "./states/LoadingState";

const CHARTS = { bar: BarChart, line: LineChart, pie: PieChart };

export function ChartCard({
  title,
  actions,
  type = "bar",
  height = 280,
  loading = false,
  ...chartProps
}) {
  const Chart = CHARTS[type] ?? BarChart;
  return (
    <SectionCard title={title} actions={actions}>
      <Box sx={{ width: "100%", height }}>
        {loading ? (
          <LoadingState variant="cards" count={1} columns={1} height={height} />
        ) : (
          <Chart height={height} {...chartProps} />
        )}
      </Box>
    </SectionCard>
  );
}

export default ChartCard;
