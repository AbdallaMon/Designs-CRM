import ClientPage from "@/app/UiComponents/client-page/ClientPage.jsx";
import LanguageProvider from "@/app/providers/LanguageProvider.jsx";

export default function page() {
  return (
    <LanguageProvider>
      <Suspense>
        <ClientPage />
      </Suspense>
    </LanguageProvider>
  );
}
