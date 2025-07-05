import { Suspense } from "react";
import ClientImageSelection from "../UiComponents/DataViewer/image-session/client-session/ClientImageSelection";
import LanguageSwitcherProvider from "../providers/LanguageSwitcherProvider";

export default function page({ params, searchParams }) {
  const token = searchParams.token;
  return (
    <Suspense>
      <LanguageSwitcherProvider initialLng={searchParams.lng}>
        <ClientImageSelection token={token} />
      </LanguageSwitcherProvider>
    </Suspense>
  );
}
