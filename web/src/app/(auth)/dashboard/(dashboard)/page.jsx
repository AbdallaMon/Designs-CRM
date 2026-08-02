"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import Dashboard from "@/features/dashboard/Dashboard.jsx";
import NewLeadsPage from "@/features/leads/pages/NewLeadsPage.jsx";
import AccountantLanding from "./_profile-landings/AccountantLanding.jsx";
// ⏸️ My Day disabled 2026-07-16 (user request) — the strip deep-links to /dashboard/my-day,
// which now renders blank. Un-comment together with the My Day page + nav row.
// import MyDayStrip from "@/features/my-day/MyDayStrip.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.profile) return null;
  let content;
  if (user.profile === "ACCOUNTANT") {
    content = <AccountantLanding />;
  } else if (user.profile === "CONTACT_INITIATOR") {
    const searchParams = Object.fromEntries(sp.entries());
    content = <NewLeadsPage searchParams={searchParams} withSearch={true} />;
  } else if (user.profile === "DESIGNER_3D") {
    content = <Dashboard staff={true} userProfile="DESIGNER_3D" />;
  } else if (user.profile === "DESIGNER_2D") {
    content = <Dashboard staff={true} userProfile="DESIGNER_2D" />;
  } else {
    content = (
      <Dashboard
        staff={["NORMAL_SALES", "PRIMARY_SALES"].includes(user.profile)}
        userProfile={user.profile}
      />
    );
  }

  // Contextual My Day pulse — the full queue stays at /dashboard/my-day; this strip only
  // surfaces counts + the top item on the landing page and deep-links there.
  // ⏸️ Disabled 2026-07-16 with the My Day screen: return (<><MyDayStrip />{content}</>);
  return content;
}
