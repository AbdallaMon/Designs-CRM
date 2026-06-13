"use client";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import NotificationPage from "@/app/UiComponents/DataViewer/Logs.jsx";

export default function Notification() {
  const { user } = useAuth();
  const sp = useSearchParams();
  if (!user?.role) return null;
  const role = user.role;

  if (role === "STAFF" && !user.isSuperSales) {
    return <NotificationPage />;
  }
  const searchParams = Object.fromEntries(sp.entries());
  return <NotificationPage searchParams={searchParams} />;
}
