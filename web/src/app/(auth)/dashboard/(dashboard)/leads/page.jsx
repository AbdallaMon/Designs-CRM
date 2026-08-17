"use client";
import { PROFILES } from "@dms/shared";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import NewLeadsPage from "@/features/leads/pages/NewLeadsPage.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.profile) return null;
  const searchParams = Object.fromEntries(sp.entries());

  if ([PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES].includes(user.profile)) {
    return <NewLeadsPage staff={true} searchParams={searchParams} />;
  }
  return <NewLeadsPage searchParams={searchParams} />;
}
