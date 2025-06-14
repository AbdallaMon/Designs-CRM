import "./globals.css";
import ToastProvider from "@/app/providers/ToastLoadingProvider";
import AuthProvider from "@/app/providers/AuthProvider";
import MUIContextProvider from "@/app/providers/MUIContext";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading";
import MuiAlertProvider from "@/app/providers/MuiAlert.jsx";
import colors from "@/app/helpers/colors.js";
import { Noto_Kufi_Arabic } from "next/font/google";

const noto = Noto_Kufi_Arabic({
  weight: ["400", "500", "700"],
  style: ["normal"],
  subsets: ["arabic"],
  display: "swap",
});
export const metadata = {
  title: "Dream Studio - Dream Design & Luxurious Home Solutions",
  description:
    "Dream Studio specializes in urban design, luxurious home interiors, furniture, and decor, combining elegance, comfort, and well-being to create your dream spaces.",
  keywords:
    "Dream Studio,Dream, urban design, تصميم عمراني, luxurious home design, interior design, furniture, home decor, elegant living, custom home solutions",
  icon: "/favicon.ico",
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
            <ToastProvider>
              <AuthProvider>
                <DotsLoader />
                {children}
              </AuthProvider>
            </ToastProvider>
          </MUIContextProvider>
        </MuiAlertProvider>
      </body>
    </html>
  );
}
