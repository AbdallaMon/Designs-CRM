"use client";

import { useEffect } from "react";
import DotsLoader from "../feedback/loaders/DotsLoading";

export default function ClinetPage() {
  useEffect(() => {
    if (typeof window !== undefined) {
      window.location.href = "https://ahmadmobayed.com/";
    }
  }, []);
  return <DotsLoader instantLoading={true} />;
}
