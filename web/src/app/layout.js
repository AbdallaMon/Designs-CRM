import "./globals.css";
import { RtlCacheProvider } from "@/app/v2/providers/RtlCacheProvider";
import { ToastProvider } from "@/app/v2/providers/ToastProvider";
import { AuthProvider } from "@/app/v2/providers/AuthProvider";
import { MUIProvider } from "@/app/v2/providers/MUIProvider";
import DotsLoader from "@/app/v2/shared/components/feedback/DotsLoading";
import { AlertProvider } from "@/app/v2/providers/MuiAlertProvider";
import colors from "@/app/v2/lib/theme/colors";
import { Noto_Kufi_Arabic } from "next/font/google";
import { UploadingProvider } from "@/app/v2/providers/UploadingProvider";

import ServiceWorkerRegister from "@/app/v2/shared/components/RegisterServiceWorker";

const noto = Noto_Kufi_Arabic({
  weight: ["400", "500", "700"],
  style: ["normal"],
  subsets: ["arabic"],
  display: "swap",
});

// app/layout.js
export const metadata = {
  title: "Dream Studio | تصميم داخلي فاخر وتصميم عمراني وأثاث مُصمّم خصيصًا",
  description:
    "Dream Studio يقدم حلول تصميم داخلي فاخر، وتصميم عمراني مبتكر، وأثاثًا مُصمّمًا حسب الطلب. نخدم العملاء المميزين في الإمارات بتصاميم تمزج بين الأناقة والراحة والطابع العملي للمنازل والفلل والمساحات التجارية.",
  keywords: [
    "Dream Studio",
    "تصميم داخلي فاخر",
    "تصميم عمراني",
    "أثاث مُصمّم حسب الطلب",
    "ديكور حديث",
    "تصميم مجالس",
    "تصميم فلل",
    "ديكورات فاخرة",
    "تصميم داخلي دبي",
    "تصميم داخلي أبوظبي",
    "تصميم فلل فاخرة الإمارات",
    "أثاث فاخر الإمارات",
    // دعم بحث عالمي
    "Dream Studio interior design",
    "Dream Studio urban design",
    "Dream Studio furniture design",
    "luxury villa design UAE",
    "custom furniture UAE",
    "luxury interiors Dubai",
    "modern decor Abu Dhabi",
  ],
  creator: "Dream Studio",
  metadataBase: new URL("https://dreamstudiio.com"),
  openGraph: {
    title: "Dream Studio | تصميم داخلي فاخر وتصميم عمراني",
    description:
      "نحوّل الرؤى إلى مساحات فاخرة وأنيقة وعملية للمنازل والفلل والمشاريع التجارية  الإمارات مع خبراء Dream Studio.",
    url: "https://dreamstudiio.com",
    siteName: "Dream Studio",
    images: [
      {
        url: "https://dreamstudiio.com/main-logo.jpg",
        width: 1200,
        height: 630,
        alt: "Dream Studio - تصميم داخلي فاخر وتصميم عمراني",
      },
    ],
    locale: "ar_AE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dream Studio | تصميم داخلي فاخر وتصميم عمراني",
    description:
      "تصميم داخلي فاخر، تصميم عمراني مبتكر، وأثاث مُصمّم خصيصًا للمنازل والفلل والمساحات التجارية في الإمارات.",
    images: ["https://dreamstudiio.com/main-logo.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  // Single-language Arabic / RTL app (legacy + v2). This is the nearest layout that controls
  // <html>; the v2 (v2-features) routes render under it, so the document root direction is set
  // here once for the whole app (UX plan §2 a11y — root lang/dir). The v2 feature layouts also
  // set dir="rtl" on their Box for the emotion-RTL cache, which remains correct.
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={noto.className}
        style={{ backgroundColor: colors.bgSecondary }}
      >
        {/* SSR-aware RTL emotion cache (MUI's official App Router integration). Applies the
            stylis-plugin-rtl transform during the server render so RTL is correct on FIRST
            paint for EVERY route (login, dashboard, lead detail) with no LTR-flash / hydration
            mismatch. The flip is done by the stylis rtl plugin in the emotion cache + this
            <html dir="rtl">; the MUI theme direction is kept "ltr" to avoid a double-flip
            (mirrors the working reference project's wiring). Implemented as a
            Client Component because the rtl stylis plugin is a function and can't be passed as
            a prop from this Server Component layout. */}
        <RtlCacheProvider>
          <AlertProvider>
            <MUIProvider>
              <UploadingProvider>
                <ToastProvider>
                  <AuthProvider>
                    <DotsLoader />
                    {children}
                  </AuthProvider>
                  <ServiceWorkerRegister />
                </ToastProvider>
              </UploadingProvider>
            </MUIProvider>
          </AlertProvider>
        </RtlCacheProvider>
      </body>
    </html>
  );
}
