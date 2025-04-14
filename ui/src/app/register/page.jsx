import LanguageProvider from "@/app/providers/LanguageProvider.jsx";
import { Suspense } from "react";
import RegisterPage from "../UiComponents/client-page/RegisterPage";

export default function page() {
  return (
    <LanguageProvider>
      <Suspense>
        <RegisterPage />
      </Suspense>
    </LanguageProvider>
  );
}
