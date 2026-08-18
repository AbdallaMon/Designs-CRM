import "./globals.css";
import ToastProvider from "@/app/providers/ToastLoadingProvider";
import AuthProvider from "@/app/providers/AuthProvider";
import MUIContextProvider from "@/app/providers/MUIContext";
import DotsLoader from "@/shared/components/feedback/loaders/DotsLoading";
import MuiAlertProvider from "@/app/providers/MuiAlert.jsx";
import colors from "@/app/helpers/colors.js";
import UploadingProvider from "./providers/UploadingProgressProvider";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

const coursesOrigin = process.env.NEXT_PUBLIC_COURSES_URL || "http://localhost:4011";
const coursesLogoUrl = new URL("/main-logo.jpg", `${coursesOrigin}/`).toString();

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
    "Online courses", // Online Courses
    "Professional training", // Professional Training
  ],

  creator: "Dream Studio",

  metadataBase: new URL(coursesOrigin),

  openGraph: {
    title: "Courses & Professional Training | Dream Studio Learning",
    description:
      "Elevate your career with expert-led courses and practical training at Dream Studio Learning.",
    url: coursesOrigin,
    siteName: "Dream Studio Learning",
    images: [
      {
        url: coursesLogoUrl,
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
    images: [coursesLogoUrl],
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};
export default function RootLayout({ children }) {
  return (
    <html lang="en" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        suppressHydrationWarning
        style={{ backgroundColor: colors.bgSecondary }}
      >
        <AppRouterCacheProvider>
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
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
