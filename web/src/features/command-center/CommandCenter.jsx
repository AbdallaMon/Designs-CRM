"use client";
// CommandCenter — the composed ADMIN/SUPER_ADMIN operational hub.
//
// Two independent fetches, both through the shared `getData` data layer (never raw fetch):
//   • the composite overview endpoint (`command-center/overview`) → KPIs, pipeline,
//     capacity, delivery — the same dashboard-card fetch pattern (getData in a useEffect).
//   • the existing admin-only audit surface (`audit-logs`, limit 8) → the activity feed.
//
// Each widget owns its loading / empty / error state; a failed overview shows a retry
// affordance without collapsing the whole screen.
import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Grid } from "@mui/material";
import { getData } from "@/app/helpers/functions/getData.js";
import KpiTilesRow from "@/features/command-center/KpiTilesRow.jsx";
import PipelineByStatus from "@/features/command-center/PipelineByStatus.jsx";
import TeamCapacityPanel from "@/features/command-center/TeamCapacityPanel.jsx";
import DeliveryHealthPanel from "@/features/command-center/DeliveryHealthPanel.jsx";
import ActivityFeed from "@/features/command-center/ActivityFeed.jsx";

const OVERVIEW_URL = "command-center/overview";
const ACTIVITY_URL = "audit-logs";
const ACTIVITY_LIMIT = 8;

export default function CommandCenter() {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(false);

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);

  const fetchOverview = useCallback(async () => {
    setOverviewError(false);
    const res = await getData({ url: OVERVIEW_URL, setLoading: setOverviewLoading });
    if (res && res.status === 200) {
      setOverview(res.data);
    } else {
      setOverviewError(true);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setActivityError(false);
    // Mirror useDataFetcher's call shape (page + limit as native params) so the audit
    // endpoint receives a single clean `limit` — not a duplicated one from getData's defaults.
    const res = await getData({
      url: ACTIVITY_URL,
      page: 1,
      limit: ACTIVITY_LIMIT,
      setLoading: setActivityLoading,
    });
    if (res && res.status === 200) {
      setActivity(Array.isArray(res.data) ? res.data : []);
    } else {
      setActivityError(true);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchActivity();
  }, [fetchOverview, fetchActivity]);

  return (
    <Box>
      {overviewError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={fetchOverview}>
              Retry
            </Button>
          }
        >
          Couldn&apos;t load the Command Center overview.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={12}>
          <KpiTilesRow kpis={overview?.kpis} loading={overviewLoading} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <PipelineByStatus
            pipeline={overview?.pipeline}
            loading={overviewLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TeamCapacityPanel
            capacity={overview?.capacity}
            loading={overviewLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <DeliveryHealthPanel
            delivery={overview?.delivery}
            loading={overviewLoading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <ActivityFeed
            items={activity}
            loading={activityLoading}
            error={activityError}
            onRetry={fetchActivity}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
