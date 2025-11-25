import { Suspense } from "react";
import ClientBooking from "../UiComponents/DataViewer/meeting/calendar/ClientBooking";
import MuiAlertProvider from "../providers/MuiAlert";

export default function BookingPage({ params, searchParams }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MuiAlertProvider>
        <ClientBooking token={searchParams.token} />;
      </MuiAlertProvider>
    </Suspense>
  );
}
