import { Suspense } from "react";
import { UsersPage } from "@/app/v2/features/users";

export default function Page() {
  return (
    <Suspense>
      <UsersPage />
    </Suspense>
  );
}
