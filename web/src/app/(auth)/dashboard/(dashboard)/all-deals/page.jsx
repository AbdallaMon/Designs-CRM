"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import AllDealsPage from "@/features/leads/pages/AllDealsPage.jsx";

export default function Page() {
  const { user } = useAuth();
  if (!user?.role) return null;
  const role = user.role;

  if (role === "STAFF" && user.profile !== "SUPER_SALES") {
    return <AllDealsPage staff={true} />;
  }
  return <AllDealsPage />;
}
