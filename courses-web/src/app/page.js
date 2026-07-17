"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DotsLoader from "@/shared/components/feedback/loaders/DotsLoading";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard");
  }, []);
  return <DotsLoader instantLoading={true} />;
}
