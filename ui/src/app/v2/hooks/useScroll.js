"use client";
import { useEffect } from "react";

/**
 * Fire `loadMore` when the user scrolls near the TOP or BOTTOM of a container, only
 * while moving in that direction. Migrated from the legacy chat useScroll to keep the
 * exact infinite-scroll behavior (rooms list/files near-bottom, messages near-top).
 */
export function useScroll(
  scrollContainerRef,
  loadMore,
  THRESHOLD_PX,
  type = "BOTTOM",
  rebind,
) {
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let lastScrollTop = el.scrollTop;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrollTop = el.scrollTop;
        const goingInDesiredDirection =
          type === "BOTTOM"
            ? scrollTop > lastScrollTop
            : scrollTop < lastScrollTop;
        lastScrollTop = scrollTop;
        const remaining =
          type === "BOTTOM"
            ? el.scrollHeight - el.clientHeight - scrollTop
            : scrollTop;

        const near = remaining <= THRESHOLD_PX;
        if (goingInDesiredDirection && near) loadMore();
        ticking = false;
      });
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadMore, THRESHOLD_PX, type, scrollContainerRef, rebind]);
}
