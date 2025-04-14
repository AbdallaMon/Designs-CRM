import { Suspense } from "react";
import CancelPage from "./CancelPage";

export const metadata = {
  title: "Payment Unsuccessful - Dream Studio",
  description:
    "We encountered an issue processing your payment. Please try again or contact our support team for assistance.",
  keywords:
    "payment failed, payment issue, Dream Studio, payment error, retry payment",
  icon: "/favicon.ico",
  openGraph: {
    title: "Payment Unsuccessful - Dream Studio",
    description:
      "There was an issue processing your payment. Please try again or contact our support team.",
    url: "https://dreamstudiio.com/failed",
    siteName: "Dream Studio",
    locale: "en",
    type: "website",
  },
};
export default function page() {
  return (
    <Suspense>
      <CancelPage />
    </Suspense>
  );
}
