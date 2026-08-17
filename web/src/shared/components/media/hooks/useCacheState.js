import { useEffect, useState } from "react";
import { isInPrivateMediaCache } from "@/shared/components/media/privateCacheState.js";

export function useCacheStatus(url) {
  const [cached, setCached] = useState(null); // null = unknown
  useEffect(() => {
    let alive = true;
    setCached(null);

    if (!url) {
      setCached(false);
      return;
    }

    isInPrivateMediaCache(url).then((v) => {
      if (alive) setCached(Boolean(v));
    });

    return () => {
      alive = false;
    };
  }, [url]);

  return cached;
}
