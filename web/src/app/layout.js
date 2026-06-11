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
import { cookies } from "next/headers";
import {
  cookieName,
  fallbackLng,
  getDirection,
  normalizeLang,
} from "@/app/v2/lib/i18n/settings";
import { I18nProvider } from "@/app/v2/lib/i18n/I18nProvider";

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

export default async function RootLayout({ children }) {
  // BILINGUAL (Phase 1). The DOCUMENT language/direction is resolved on the SERVER from the `lang`
  // cookie (default "ar"), modeled on the working reference's cookie read. ar → rtl, en → ltr.
  //
  // LANGUAGE SOURCE: cookie `lang` here (SSR) + `?lang` as a client override (the I18nProvider
  // reads searchParams on mount and persists it to the cookie). The LanguageSwitcher writes the
  // cookie and calls router.refresh(), so this server read re-runs with the new value and the
  // emotion cache (muirtl ↔ mui) + <html dir> flip cleanly.
  //
  // CRITICAL: with no cookie the value is "ar" and EVERYTHING below is byte-identical to the
  // previous single-language app (key "muirtl", stylis rtl plugin, <html dir="rtl">).
  const cookieStore = await cookies();
  const lng = normalizeLang(cookieStore.get(cookieName)?.value || fallbackLng);
  const dir = getDirection(lng);

  return (
    <html lang={lng} dir={dir}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={noto.className}
        style={{ backgroundColor: colors.bgSecondary }}
      >
        {/* SSR-aware emotion cache (MUI's official App Router integration). For ar it applies the
            stylis-plugin-rtl transform during the server render so RTL is correct on FIRST paint
            for EVERY route with no LTR-flash / hydration mismatch (key "muirtl"); for en it uses a
            plain LTR cache (key "mui"). The flip is done by the stylis rtl plugin + <html dir>; the
            theme direction is kept "ltr" to avoid a double-flip (mirrors the working reference).
            Client Component because the rtl stylis plugin is a function and can't cross the
            Server→Client prop boundary; the resolved `lng` selects the options inside it. */}
        <RtlCacheProvider lng={lng}>
          <I18nProvider initialLng={lng}>
            <AlertProvider>
              <MUIProvider lng={lng}>
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
          </I18nProvider>
        </RtlCacheProvider>
      </body>
    </html>
  );
}
