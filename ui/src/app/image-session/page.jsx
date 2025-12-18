import { Suspense } from "react";
import ClientImageSelection from "../UiComponents/DataViewer/image-session/client-session/ClientImageSelection";
import LanguageSwitcherProvider from "../providers/LanguageSwitcherProvider";

export default async function page({ params, searchParams }) {
  const awaitedSearchParams = await searchParams;
  const token = awaitedSearchParams.token;
  return (
    <Suspense>
      <LanguageSwitcherProvider initialLng={awaitedSearchParams.lng}>
        <ClientImageSelection token={token} />
      </LanguageSwitcherProvider>
    </Suspense>
  );
}
