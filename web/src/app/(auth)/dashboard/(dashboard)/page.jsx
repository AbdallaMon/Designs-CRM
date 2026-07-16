"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import Dashboard from "@/features/dashboard/Dashboard.jsx";
import NewLeadsPage from "@/features/leads/pages/NewLeadsPage.jsx";
import AccountantLanding from "./_role-landings/AccountantLanding.jsx";
// ⏸️ My Day disabled 2026-07-16 (user request) — the strip deep-links to /dashboard/my-day,
// which now renders blank. Un-comment together with the My Day page + nav row.
// import MyDayStrip from "@/features/my-day/MyDayStrip.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.role) return null;
  const role = user.role;

  let content;
  if (role === "ACCOUNTANT") {
    content = <AccountantLanding />;
  } else if (role === "CONTACT_INITIATOR") {
    const searchParams = Object.fromEntries(sp.entries());
    content = <NewLeadsPage searchParams={searchParams} withSearch={true} />;
  } else if (role === "THREE_D_DESIGNER") {
    content = <Dashboard staff={true} userRole="THREE_D_DESIGNER" />;
  } else if (role === "TWO_D_DESIGNER") {
    content = <Dashboard staff={true} userRole="TWO_D_DESIGNER" />;
  } else {
    content = <Dashboard staff={role === "STAFF" && user.profile !== "SUPER_SALES"} />;
  }

  // Contextual My Day pulse — the full queue stays at /dashboard/my-day; this strip only
  // surfaces counts + the top item on the landing page and deep-links there.
  // ⏸️ Disabled 2026-07-16 with the My Day screen: return (<><MyDayStrip />{content}</>);
  return content;
}
