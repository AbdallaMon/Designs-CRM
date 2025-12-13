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
import SocketProvider from "./providers/SocketProvider";

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
                  <SocketProvider>
                    <DotsLoader />
                    {children}
                  </SocketProvider>
                </AuthProvider>
              </ToastProvider>
            </UploadingProvider>
          </MUIContextProvider>
        </MuiAlertProvider>
      </body>
    </html>
  );
}
