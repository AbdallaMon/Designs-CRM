import "./globals.css";
import ToastProvider from "@/app/providers/ToastLoadingProvider";
import AuthProvider from "@/app/providers/AuthProvider";
import MUIContextProvider from "@/app/providers/MUIContext";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading";
import MuiAlertProvider from "@/app/providers/MuiAlert.jsx";
import colors from "@/app/helpers/colors.js";

import { Roboto } from 'next/font/google'

const roboto = Roboto({
    weight: ['400',"500", '700'],
    style: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
})
export const metadata = {
  title: "Welcome",
  description: "",
};

export default function RootLayout({children}) {
  return (
        <html>
        <body
              className={roboto.className}
              style={{backgroundColor: colors.bgSecondary}}
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
