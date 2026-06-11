import { Suspense } from "react";
import { UtilitiesPage } from "@/app/v2/features/utilities";

export default function Page() {
  return (
    <Suspense>
      <UtilitiesPage />
    </Suspense>
  );
}
