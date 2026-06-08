import { Suspense } from "react";
import { NotificationsPage } from "@/app/v2/features/notifications";

export default function Page() {
  return (
    <Suspense>
      <NotificationsPage />
    </Suspense>
  );
}
