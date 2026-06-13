"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import Dashboard from "@/app/UiComponents/DataViewer/dashbaord/Dashboard.jsx";
import NewLeadsPage from "@/app/UiComponents/DataViewer/leads/pages/NewLeadsPage.jsx";
import AccountantLanding from "./_role-landings/AccountantLanding.jsx";

// Collapsed /dashboard landing. Master had a different @role/page.jsx per slot; here one page
// renders the same per-role landing component, switched on the authenticated user's role.
export default function Page() {
  const { user } = useAuth();
  const role = user?.role;
  if (!role) return null;

  if (role === "ACCOUNTANT") return <AccountantLanding />;
  if (role === "CONTACT_INITIATOR") return <NewLeadsPage withSearch={true} />;

  // ADMIN / SUPER_ADMIN / SUPER_SALES / STAFF
  const staff = role === "STAFF" && !user?.isSuperSales;
  return <Dashboard staff={staff} />;
}
