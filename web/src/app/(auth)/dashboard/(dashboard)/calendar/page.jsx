"use client";
import { useAuth } from "@/app/providers/AuthProvider";
import CalendarBookingSystem from "@/app/UiComponents/DataViewer/meeting/calendar/AdminCalendar";
import StaffCalendarPanel from "@/app/UiComponents/DataViewer/meeting/calendar/StaffCalendar";

export default function Page() {
  const { user } = useAuth();
  if (!user?.role) return null;
  const role = user.role;

  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return <CalendarBookingSystem />;
  }
  if (role === "SUPER_SALES" || (role === "STAFF" && user.isSuperSales)) {
    return <StaffCalendarPanel isAdmin={true} />;
  }
  return <StaffCalendarPanel />;
}
