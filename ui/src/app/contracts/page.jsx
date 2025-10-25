import { Suspense } from "react";
import ClientContractPage from "../UiComponents/DataViewer/contracts/client/ClientContractPage";
import LanguageSwitcherProvider from "../providers/LanguageSwitcherProvider";

export default function page({ params, searchParams }) {
  const token = searchParams.token;
  return (
    <Suspense>
      <LanguageSwitcherProvider initialLng={searchParams.lng}>
        <ClientContractPage token={token} />
      </LanguageSwitcherProvider>
    </Suspense>
  );
}
