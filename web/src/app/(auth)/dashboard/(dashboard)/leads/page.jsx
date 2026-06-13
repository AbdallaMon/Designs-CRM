"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import NewLeadsPage from "@/app/UiComponents/DataViewer/leads/pages/NewLeadsPage.jsx";

export default function Page() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.role) return null;
  const role = user.role;
  const searchParams = Object.fromEntries(sp.entries());

  if (role === "STAFF" || role === "SUPER_SALES") {
    return <NewLeadsPage staff={true} searchParams={searchParams} />;
  }
  return <NewLeadsPage searchParams={searchParams} />;
}
