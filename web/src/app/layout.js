import "./globals.css";
import { Noto_Kufi_Arabic } from "next/font/google";
import colors from "@/app/helpers/colors.js";

const noto = Noto_Kufi_Arabic({
  weight: ["400", "500", "700"],
  style: ["normal"],
  subsets: ["arabic"],
  display: "swap",
});

export const metadata = {
  title: "Dream Studio | تصميم داخلي فاخر وتصميم عمراني وأثاث مُصمّم خصيصًا",
  description:
    "Dream Studio يقدم حلول تصميم داخلي فاخر، وتصميم عمراني مبتكر، وأثاثًا مُصمّمًا حسب الطلب.",
  metadataBase: new URL("https://dreamstudiio.com"),
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/favicon.ico" },
};

// Minimal Arabic-RTL root. Each v2 feature route layout under (v2-features)/v2/* is
// self-contained (its own emotion RTL cache + MUIProvider + ToastProvider + AuthProvider),
// so the root only supplies the HTML shell + Arabic font + base background. No global
// providers, no i18n, no redesign primitives — the faithful pre-redesign (57a3c00) baseline.
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
        {children}
      </body>
    </html>
  );
}
