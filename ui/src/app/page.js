"use client";
import ClientPage from "@/app/UiComponents/client-page/ClientPage.jsx";
import LanguageProvider from "@/app/providers/LanguageProvider.jsx";
import { Suspense } from "react";
import FloatingWhatsAppButton from "./UiComponents/buttons/FloatingWhatsappButton";
import LanguageSwitcherProvider from "./providers/LanguageSwitcherProvider";
export function downloadMdLogs(filename = "debug-log.md") {
  if (typeof window === "undefined") return;

  const content = localStorage.getItem("debug-log-md") || "";
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
export default function page() {
  return <button onClick={() => downloadMdLogs()}>Download logs</button>;
  return (
    <LanguageProvider>
      <Suspense>
        <LanguageSwitcherProvider>
          <ClientPage />
          <FloatingWhatsAppButton />
        </LanguageSwitcherProvider>
      </Suspense>
    </LanguageProvider>
  );
}
