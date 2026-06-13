import { Suspense } from "react";
import ResetPage from "./ResetPage";

export default function page(props) {
  return (
    <Suspense>
      <ResetPage />
    </Suspense>
  );
}
