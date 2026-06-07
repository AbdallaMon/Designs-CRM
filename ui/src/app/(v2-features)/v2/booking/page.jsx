import { Suspense } from "react";
import { PublicBookingPage } from "@/app/v2/features/calendar";

export default function Page() {
  return (
    <Suspense>
      <PublicBookingPage />
    </Suspense>
  );
}
