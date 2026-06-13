"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import AllDealsPage from "@/app/UiComponents/DataViewer/leads/pages/AllDealsPage.jsx";

export default function Page() {
  const { user } = useAuth();
  if (!user?.role) return null;
  const role = user.role;

  if (role === "STAFF" && !user.isSuperSales) {
    return <AllDealsPage staff={true} />;
  }
  return <AllDealsPage />;
}
