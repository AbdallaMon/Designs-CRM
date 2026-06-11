"use client";

// PUBLIC booking page wrapper. UNGATED — the per-meeting token (query param) is the auth.
// Renders the booking wizard inside Suspense (the wizard reads useSearchParams).

import { Suspense } from "react";
import PublicBooking from "../components/PublicBooking.jsx";

export function PublicBookingPage() {
  return (
    <Suspense fallback={null}>
      <PublicBooking />
    </Suspense>
  );
}

export default PublicBookingPage;
