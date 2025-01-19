import "./globals.css";
import ToastProvider from "@/app/providers/ToastLoadingProvider";
import AuthProvider from "@/app/providers/AuthProvider";
import MUIContextProvider from "@/app/providers/MUIContext";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading";
import MuiAlertProvider from "@/app/providers/MuiAlert.jsx";
import colors from "@/app/helpers/colors.js";

import { Roboto } from 'next/font/google'
import { Noto_Kufi_Arabic } from 'next/font/google';

const roboto = Noto_Kufi_Arabic({
    weight: ['400',"500", '700'],
    style: ['normal'],
    subsets: ['arabic'],
    display: 'swap',
})
export const metadata = {
  title: "Dream Studio - Create Your Dream with Us",
  description: "Dream Studio offers luxurious home designs, including furniture and decor, blending elegance with comfort and well-being.",
    icon:"/logo-full.jpg"
};

export default function RootLayout({children}) {
  return (
        <html>
        <head>
            <link rel="icon" href="/logo-full.jpg" type="image/png" sizes="32x32"/>
        </head>
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
