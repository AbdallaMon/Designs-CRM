import "./globals.css";
import ToastProvider from "@/app/providers/ToastLoadingProvider";
import AuthProvider from "@/app/providers/AuthProvider";
import MUIContextProvider from "@/app/providers/MUIContext";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading";
import MuiAlertProvider from "@/app/providers/MuiAlert.jsx";
import colors from "@/app/helpers/colors.js";
import { Noto_Kufi_Arabic } from "next/font/google";
import UploadingProvider, {
  UploadingContext,
} from "./providers/UploadingProgressProvider";

const noto = Noto_Kufi_Arabic({
  weight: ["400", "500", "700"],
  style: ["normal"],
  subsets: ["arabic"],
  display: "swap",
});

export const metadata = {
  // A more direct and keyword-rich title.
  title: "Luxurious Interior & Urban Design & Dream Design  | Dream Studio",

  // A more active and benefit-driven description.
  description:
    "Dream Studio specializes in urban design, luxurious home interiors, furniture, and decor, combining elegance, comfort, and well-being to create your dream spaces.",

  keywords: [
    "Dream Studio",
    "interior design Egypt",
    "urban design Cairo",
    "luxurious home design",
    "custom furniture",
    "home decor",
    "architectural design",
    "elegant interiors",
    "تصميم داخلي", // "Interior Design" in Arabic
    "تصميم عمراني", // "Urban Design" in Arabic
  ],

  creator: "Dream Studio",

  metadataBase: new URL("https://dreamstudiio.com"), // Replace with your actual domain

  openGraph: {
    title: "Luxurious Interior & Urban Design | Dream Studio",
    description:
      "Transforming visions into luxurious and elegant living spaces.",
    url: "https://dreamstudiio.com", // Replace with your actual domain
    siteName: "Dream Studio",
    images: [
      {
        url: "https://dreamstudiio.com/dream-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Luxurious Interior & Urban Design | Dream Studio.",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter-specific metadata for better card appearance on Twitter.
  twitter: {
    card: "summary_large_image",
    title: "Luxurious Interior & Urban Design | Dream Studio",
    description:
      "Transforming visions into luxurious and elegant living spaces.",
    images: ["https://dreamstudiio.com/dream-logo.jpg"], // Path to your Twitter image
  },

  // Standard icon definition.
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={noto.className}
        style={{ backgroundColor: colors.bgSecondary }}
      >
        <MuiAlertProvider>
          <MUIContextProvider>
            <UploadingProvider>
              <ToastProvider>
                <AuthProvider>
                  <DotsLoader />
                  {children}
                </AuthProvider>
              </ToastProvider>
            </UploadingProvider>
          </MUIContextProvider>
        </MuiAlertProvider>
      </body>
    </html>
  );
}
