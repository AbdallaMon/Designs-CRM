import ResetPage from "@/app/v2/features/auth/pages/ResetPage";
import { Suspense } from "react";

export default function page(props) {
  return <ResetPage />;

  return (
    <Suspense>
      <ResetPage />
    </Suspense>
  );
}
