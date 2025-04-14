import { Suspense } from "react";
import SuccessPage from "./SuccessPage";

export const metadata = {
  title: "Payment Successful - Dream Studio",
  description:
    "Your payment has been successfully processed. Thank you for choosing Dream Studio for your design needs.",
  keywords:
    "payment successful, order confirmation, Dream Studio, design services, payment complete",
  icon: "/favicon.ico",
  openGraph: {
    title: "Payment Successfully Processed - Dream Studio",
    description:
      "Thank you for your payment. Begin your journey with Dream Studio's luxurious design services.",
    url: "https://dreamstudiio.com/success",
    siteName: "Dream Studio",
    locale: "en",
    type: "website",
  },
};
export default function page() {
  return (
    <Suspense>
      <SuccessPage />
    </Suspense>
  );
}
