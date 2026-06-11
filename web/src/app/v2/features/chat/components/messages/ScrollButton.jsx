"use client";

import { useState, useEffect } from "react";
import { IconButton, Zoom } from "@mui/material";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

/** Floating scroll-to-edge button. Uses theme palette instead of legacy colors import. */
export function ScrollButton({ containerRef, direction = "down", threshold = 1200, position = {} }) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    const checkScroll = () => {
      if (direction === "down") {
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        setShowButton(distanceFromBottom > threshold);
      } else {
        setShowButton(container.scrollTop > threshold);
      }
    };
    checkScroll();
    container.addEventListener("scroll", checkScroll, { passive: true });
    return () => container.removeEventListener("scroll", checkScroll);
  }, [containerRef, direction, threshold]);

  const handleClick = () => {
    const container = containerRef?.current;
    if (!container) return;
    container.scrollTo({
      top: direction === "down" ? container.scrollHeight : 0,
      behavior: "smooth",
    });
  };

  const defaultPosition =
    direction === "down" ? { bottom: 0, right: 6 } : { top: 16, right: 16 };

  return (
    <Zoom in={showButton}>
      <IconButton
        onClick={handleClick}
        sx={{
          position: "sticky",
          ...defaultPosition,
          ...position,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          boxShadow: 3,
          zIndex: 10,
          "&:hover": { bgcolor: "primary.dark" },
          width: 40,
          height: 40,
          display: showButton ? "flex" : "none",
        }}
      >
        {direction === "down" ? (
          <MdKeyboardArrowDown size={24} />
        ) : (
          <MdKeyboardArrowUp size={24} />
        )}
      </IconButton>
    </Zoom>
  );
}

export default ScrollButton;
