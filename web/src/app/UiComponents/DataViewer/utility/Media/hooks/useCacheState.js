import { useEffect, useState } from "react";
import { isInCache } from "../utility";

export function useCacheStatus(url) {
  const [cached, setCached] = useState(null); // null = unknown
  useEffect(() => {
    let alive = true;
    setCached(null);

    if (!url) {
      setCached(false);
      return;
    }

    isInCache(url).then((v) => {
      if (alive) setCached(Boolean(v));
    });

    return () => {
      alive = false;
    };
  }, [url]);

  return cached;
}
