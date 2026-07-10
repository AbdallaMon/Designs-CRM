"use client";

import { useEffect } from "react";
import DotsLoader from "@/app/UiComponents/feedback/loaders/DotsLoading.jsx";

export default function ClinetPage() {
  useEffect(() => {
    if (typeof window !== undefined) {
      window.location.href = "https://ahmadmobayed.com/";
    }
  }, []);
  return <DotsLoader instantLoading={true} />;
}
