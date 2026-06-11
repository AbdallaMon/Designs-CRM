import { Suspense } from "react";
import { UserDetailPage } from "@/app/v2/features/usersDetails";

// Next 16: params is async.
export default async function Page({ params }) {
  const { id } = await params;
  return (
    <Suspense>
      <UserDetailPage userId={id} />
    </Suspense>
  );
}
