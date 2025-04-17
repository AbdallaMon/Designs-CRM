import LanguageProvider from "@/app/providers/LanguageProvider.jsx";
import { Suspense } from "react";
import { NewRegisterForm } from "../UiComponents/client-page/new-register/NewRegisterForm";
export const metadata = {
  title:
    "Book an Interior Design Consultation with Eng. احمد المبيض - Dream Studio",
  description:
    "Schedule your initial interior design consultation with Eng. احمد المبيض and begin transforming your space with Dream Studio's expertise.",
  keywords:
    "interior design consultation, Eng. احمد المبيض, المهندس احمد المبيض, Dream Studio, initial design consultation, home transformation, interior design services",
  icon: "/favicon.ico",
  openGraph: {
    title: "Interior Design Consultation with Eng. احمد المبيض - Dream Studio",
    description:
      "Take the first step toward your dream space with an expert consultation from Eng. احمد المبيض at Dream Studio.",
    url: "https://dreamstudiio.com/register",
    siteName: "Dream Studio",
    locale: "en",
    type: "website",
  },
};
export default function page() {
  return (
    <LanguageProvider>
      <Suspense>
        {/* <RegisterPage /> */}
        <NewRegisterForm />
      </Suspense>
    </LanguageProvider>
  );
}
