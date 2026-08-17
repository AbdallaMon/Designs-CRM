"use client";
import { PROFILES } from "@dms/shared";
import { useAuth } from "@/app/providers/AuthProvider";
import CalendarBookingSystem from "@/features/meeting/calendar/AdminCalendar";
import StaffCalendarPanel from "@/features/meeting/calendar/StaffCalendar";

export default function Page() {
  const { user } = useAuth();
  if (!user?.profile) return null;
  if (user.profile === PROFILES.ADMIN || user.profile === PROFILES.SUPER_ADMIN) {
    return <CalendarBookingSystem />;
  }
  if (
    user.profile === PROFILES.SUPER_SALES
  ) {
    return <StaffCalendarPanel isAdmin={true} />;
  }
  return <StaffCalendarPanel />;
}
