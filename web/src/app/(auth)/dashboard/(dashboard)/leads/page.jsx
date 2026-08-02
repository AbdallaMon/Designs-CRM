"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import NewLeadsPage from "@/features/leads/pages/NewLeadsPage.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.profile) return null;
  const searchParams = Object.fromEntries(sp.entries());

  if (["NORMAL_SALES", "PRIMARY_SALES", "SUPER_SALES"].includes(user.profile)) {
    return <NewLeadsPage staff={true} searchParams={searchParams} />;
  }
  return <NewLeadsPage searchParams={searchParams} />;
}
