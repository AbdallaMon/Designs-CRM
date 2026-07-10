import { Suspense } from "react";
import ClientBooking from "@/features/meeting/calendar/ClientBooking.jsx";
import MuiAlertProvider from "../providers/MuiAlert";

export default function BookingPage({ params, searchParams }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MuiAlertProvider>
        <ClientBooking />;
      </MuiAlertProvider>
    </Suspense>
  );
}
