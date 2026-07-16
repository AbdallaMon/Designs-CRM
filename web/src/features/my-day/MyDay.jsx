"use client";
// My Day — two permission-gated tabs, URL-synced (?tab=my-work|team). Sales/designers see
// "My work" only; admins see "Team" only (no personal queue); super-sales sees both.
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { usePermission } from "@/app/hooks/usePermission.js";
import MyWorkQueue from "@/features/my-day/MyWorkQueue.jsx";
import TeamLens from "@/features/my-day/TeamLens.jsx";

// Codes mirrored from packages/shared/constants/access/permissions.constants.js
// (PERMISSIONS.MY_DAY — web has no @dms/shared dependency).
const MY_DAY_VIEW = "my_day.view";
const MY_DAY_TEAM_VIEW = "my_day.team.view";

export default function MyDay() {
  const { hasPermission } = usePermission();
  const canView = hasPermission(MY_DAY_VIEW);
  const canTeam = hasPermission(MY_DAY_TEAM_VIEW);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const defaultTab = canView ? "my-work" : "team";
  const urlTab = searchParams.get("tab");
  const initial = (urlTab === "team" && canTeam) || (urlTab === "my-work" && canView) ? urlTab : defaultTab;
  const [activeTab, setActiveTabState] = useState(initial);

  const setActiveTab = (val) => {
    setActiveTabState(val);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("tab", String(val));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const showTabs = canView && canTeam;

  return (
    <Box>
      {showTabs && (
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 1.5 }}>
          <Tab label="My work" value="my-work" />
          <Tab label="Team" value="team" />
        </Tabs>
      )}
      {/* Ownership caption — makes "whose work am I looking at?" explicit, especially for
          super-sales who hold both surfaces. */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {activeTab === "my-work" && canView
          ? "Your personal queue — only leads and stages assigned to you."
          : "Your team — the people you supervise. Click a person to see their queue."}
      </Typography>
      {activeTab === "my-work" && canView && <MyWorkQueue />}
      {activeTab === "team" && canTeam && <TeamLens />}
    </Box>
  );
}
