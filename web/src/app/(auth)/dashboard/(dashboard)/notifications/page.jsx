"use client";
import { PROFILES } from "@dms/shared";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import NotificationPage from "@/shared/components/Logs.jsx";

export default function Notification() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.profile) return null;
  if ([PROFILES.NORMAL_SALES, PROFILES.PRIMARY_SALES].includes(user.profile)) {
    return <NotificationPage />;
  }
  const searchParams = Object.fromEntries(sp.entries());
  return <NotificationPage searchParams={searchParams} />;
}
