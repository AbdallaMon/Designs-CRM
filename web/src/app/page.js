import ClientPage from "@/features/client-page/ClientPage.jsx";
import LanguageProvider from "@/app/providers/LanguageProvider.jsx";
import { Suspense } from "react";
import FloatingWhatsAppButton from "@/shared/components/buttons/FloatingWhatsappButton.jsx";
import LanguageSwitcherProvider from "./providers/LanguageSwitcherProvider";

export default function page() {
  return (
    <LanguageProvider>
      <Suspense>
        <LanguageSwitcherProvider>
          <ClientPage />
          <FloatingWhatsAppButton />
        </LanguageSwitcherProvider>
      </Suspense>
    </LanguageProvider>
  );
}
