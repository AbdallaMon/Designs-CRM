"use client";
import { PROFILES } from "@dms/shared";
import { useAuth } from "@/app/providers/AuthProvider";
import AllDealsPage from "@/features/leads/pages/AllDealsPage.jsx";

export default function Page() {
  const { user } = useAuth();
  if (!user?.profile) return null;
  if ([PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES].includes(user.profile)) {
    return <AllDealsPage staff={true} />;
  }
  return <AllDealsPage />;
}
