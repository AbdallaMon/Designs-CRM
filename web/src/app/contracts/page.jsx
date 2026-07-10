import { Suspense } from "react";
import ClientContractPage from "@/app/UiComponents/DataViewer/contracts/client/ClientContractPage.jsx";
import LanguageSwitcherProvider from "../providers/LanguageSwitcherProvider";

export default async function page({ params, searchParams }) {
  const awaitedSearchParams = await searchParams;
  const token = awaitedSearchParams.token;
  console.log(token, "token in contract page");
  return (
    <Suspense>
      <LanguageSwitcherProvider initialLng={awaitedSearchParams.lng}>
        <ClientContractPage token={token} />
      </LanguageSwitcherProvider>
    </Suspense>
  );
}
