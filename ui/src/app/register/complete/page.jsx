import LanguageProvider from "@/app/providers/LanguageProvider";
import CompleteRegister from "@/app/UiComponents/client-page/new-register/CompleteRegister";
import { Suspense } from "react";

export default function page({ searchParams }) {
  return (
    <LanguageProvider>
      <Suspense>
        <CompleteRegister leadId={searchParams.leadId} />
      </Suspense>
    </LanguageProvider>
  );
}
