import localFont from "next/font/local";
import "./globals.css";
import ToastProvider from "@/app/providers/ToastLoadingProvider";
import AuthProvider from "@/app/providers/AuthProvider";
import MUIContextProvider from "@/app/providers/MUIContext";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading";
import MuiAlertProvider from "@/app/providers/MuiAlert.jsx";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "Welcome",
  description: "",
};

export default function RootLayout({children}) {
  return (
        <html >
        <body
              className={`${geistSans.variable} ${geistMono.variable} `}
        >
                <MuiAlertProvider>
        <MUIContextProvider>
          <ToastProvider>
            <AuthProvider>
              <DotsLoader/>
              {children}
            </AuthProvider>
          </ToastProvider>
        </MUIContextProvider>
                </MuiAlertProvider>
        </body>
        </html>
  );
}
