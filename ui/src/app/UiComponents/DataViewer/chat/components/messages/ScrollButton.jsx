"use client";

import { useState, useEffect } from "react";
import { IconButton, Zoom } from "@mui/material";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import colors from "@/app/helpers/colors";

/**
 * ScrollButton - Shows a floating button when scrolled away from target position
 * @param {Object} props
 * @param {React.RefObject} props.containerRef - Reference to scrollable container
 * @param {string} props.direction - "down" (scroll to bottom) or "up" (scroll to top)
 * @param {number} props.threshold - Distance in pixels before showing button (default: 300)
 * @param {Object} props.position - Position styles (default: bottom-right for down, top-right for up)
 */
export default function ScrollButton({
  containerRef,
  direction = "down",
  threshold = 1200,
  position = {},
}) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const checkScroll = () => {
      if (direction === "down") {
        // Show button when scrolled up from bottom
        const distanceFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        setShowButton(distanceFromBottom > threshold);
      } else {
        // Show button when scrolled down from top
        setShowButton(container.scrollTop > threshold);
      }
    };

    checkScroll(); // Initial check

    container.addEventListener("scroll", checkScroll, { passive: true });
    return () => container.removeEventListener("scroll", checkScroll);
  }, [containerRef, direction, threshold]);

  const handleClick = () => {
    const container = containerRef?.current;
    if (!container) return;

    if (direction === "down") {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
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
          bgcolor: colors.primary,
          color: "white",
          boxShadow: 3,
          zIndex: 10,
          "&:hover": {
            bgcolor: colors.secondary,
          },
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
