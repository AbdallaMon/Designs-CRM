"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import Dashboard from "@/app/UiComponents/DataViewer/dashbaord/Dashboard.jsx";
import NewLeadsPage from "@/app/UiComponents/DataViewer/leads/pages/NewLeadsPage.jsx";
import AccountantLanding from "./_role-landings/AccountantLanding.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.role) return null;
  const role = user.role;

  if (role === "ACCOUNTANT") {
    return <AccountantLanding />;
  }
  if (role === "CONTACT_INITIATOR") {
    const searchParams = Object.fromEntries(sp.entries());
    return <NewLeadsPage searchParams={searchParams} withSearch={true} />;
  }
  if (role === "THREE_D_DESIGNER") {
    return <Dashboard staff={true} userRole="THREE_D_DESIGNER" />;
  }
  if (role === "TWO_D_DESIGNER") {
    return <Dashboard staff={true} userRole="TWO_D_DESIGNER" />;
  }
  return <Dashboard staff={role === "STAFF" && !user.isSuperSales} />;
}
