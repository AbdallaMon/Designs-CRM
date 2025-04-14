import { Suspense } from "react";
import CancelPage from "./CancelPage";

export default function page() {
  return (
    <Suspense>
      <CancelPage />
    </Suspense>
  );
}
