import { Suspense } from "react";
import ClientImageSelection from "../UiComponents/DataViewer/image-session/client/ClientImageSelection";

export default function page({ params, searchParams }) {
  const token = searchParams.token;
  return (
    <Suspense>
      <ClientImageSelection token={token} />
    </Suspense>
  );
}
