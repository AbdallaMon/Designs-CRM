import { Suspense } from "react";
import ClientBooking from "../UiComponents/DataViewer/meeting/calendar/ClientBooking";

export default function BookingPage({ params, searchParams }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientBooking token={searchParams.token} />;
    </Suspense>
  );
}
