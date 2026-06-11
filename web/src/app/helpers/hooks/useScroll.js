"use client";
import { useEffect } from "react";

export function useScroll(
  scrollContainerRef,
  loadMore,
  THERSHOLD_PX,
  type = "BOTTOM",
  widgetOpen
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

        const near = remaining <= THERSHOLD_PX;

        if (goingInDesiredDirection && near) loadMore();

        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll);
    // el.addEventListener("wheel", onScroll);

    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, [loadMore, THERSHOLD_PX, type, scrollContainerRef, widgetOpen]);
}
