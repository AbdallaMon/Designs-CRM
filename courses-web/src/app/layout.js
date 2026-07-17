import "./globals.css";
import ToastProvider from "@/app/providers/ToastLoadingProvider";
import AuthProvider from "@/app/providers/AuthProvider";
import MUIContextProvider from "@/app/providers/MUIContext";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading";
import MuiAlertProvider from "@/app/providers/MuiAlert.jsx";
import colors from "@/app/helpers/colors.js";
import { Noto_Kufi_Arabic } from "next/font/google";
import UploadingProvider from "./providers/UploadingProgressProvider";

const noto = Noto_Kufi_Arabic({
  weight: ["400", "500", "700"],
  style: ["normal"],
  subsets: ["arabic"],
  display: "swap",
});

export const metadata = {
  // Clear and benefit-focused for educational platform
  title: "Courses, Training & Skill Development | Dream Studio Learning",

  // Targeted educational platform meta description
  description:
    "Dream Studio Learning offers high-quality online courses, skill-building programs, and interactive training for professionals, students, and creatives in design, development, and more.",

  keywords: [
    "Dream Studio Learning",
    "online courses",
    "training programs",
    "design courses",
    "development bootcamps",
    "learn interior design",
    "professional development",
    "online education",
    "كورسات اونلاين", // Online Courses
    "تدريب مهني", // Professional Training
  ],

  creator: "Dream Studio",

  metadataBase: new URL("https://dreamstudiio.com"),

  openGraph: {
    title: "Courses & Professional Training | Dream Studio Learning",
    description:
      "Elevate your career with expert-led courses and practical training at Dream Studio Learning.",
    url: "https://dreamstudiio.com", // Update to courses subdomain if needed
    siteName: "Dream Studio Learning",
    images: [
      {
        url: "https://dreamstudiio.com/dream-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Courses & Training | Dream Studio Learning",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Courses & Training | Dream Studio Learning",
    description:
      "Expert-led learning experiences designed for growth, creativity, and career advancement.",
    images: ["https://dreamstudiio.com/dream-logo.jpg"],
  },

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
