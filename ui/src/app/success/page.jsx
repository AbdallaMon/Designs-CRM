import { Suspense } from "react";
import SuccessPage from "./SuccessPage";

export default function page() {
  return (
    <Suspense>
      <SuccessPage />
    </Suspense>
  );
}
