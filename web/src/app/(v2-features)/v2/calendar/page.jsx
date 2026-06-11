import { Suspense } from "react";
import { CalendarPage } from "@/app/v2/features/calendar";

export default function Page() {
  return (
    <Suspense>
      <CalendarPage />
    </Suspense>
  );
}
