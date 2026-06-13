// components/LeadStatusChart.js
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  Typography,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import { COLORS, STATUS_COLORS } from "@/app/helpers/colors.js";
import { getData } from "@/app/helpers/functions/getData.js";
import LoadingOverlay from "@/app/UiComponents/feedback/loaders/LoadingOverlay.jsx";
import { useAuth } from "@/app/providers/AuthProvider.jsx";
const LeadStatusChart = ({ staff, staffId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const leadStats = {
    statuses: {
      NEW: 0,
      IN_PROGRESS: 0,
      INTERESTED: 0,
      NEEDS_IDENTIFIED: 0,
      NEGOTIATING: 0,
      CONVERTED: 0,
      REJECTED: 0,
      ON_HOLD: 0,
    },
  };
  const [data, setData] = useState(
    Object.entries(leadStats.statuses).map(([key, value]) => ({
      status: key.replace(/_/g, " "),
      count: parseFloat(value.toFixed(2)),
    }))
  );
  useEffect(() => {
    async function fetchData() {
      const extra = staffId
        ? "staffId=" + staffId
        : staff
        ? "staffId=" + user.id
        : "";

      const request = await getData({
        url: `shared/dashboard/leads-status?${extra}&`,
        setLoading,
      });
      if (request) setData(request.data);
    }
    fetchData();
  }, []);
  return (
    <Card sx={{ height: "100%", boxShadow: 3, position: "relative" }}>
      {loading && <LoadingOverlay />}
      <CardContent
        sx={{
          overflow: "auto",
        }}
      >
        <Typography
          variant={isMobile ? "h6" : "h5"}
          gutterBottom
          sx={{ fontWeight: "bold", color: "#333" }}
        >
          Lead Status Distribution
        </Typography>
        <Box sx={{ height: isMobile ? 350 : 400 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth="400px">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: isMobile ? 30 : 50,
                left: 20,
                bottom: isMobile ? 80 : 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="status"
                interval={0}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 80 : 30}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ top: -10 }}
              />
              <Bar dataKey="count" name="Number of Leads" fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      STATUS_COLORS[entry.status.replace(" ", "_")] ||
                      COLORS[index % COLORS.length]
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default LeadStatusChart;
