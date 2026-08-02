"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import AllDealsPage from "@/features/leads/pages/AllDealsPage.jsx";

export default function Page() {
  const { user } = useAuth();
  if (!user?.profile) return null;
  if (["NORMAL_SALES", "PRIMARY_SALES"].includes(user.profile)) {
    return <AllDealsPage staff={true} />;
  }
  return <AllDealsPage />;
}
