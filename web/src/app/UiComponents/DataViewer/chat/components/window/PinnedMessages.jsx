"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { PinnedMessagesBar } from "@/app/UiComponents/DataViewer/chat/components/window/PinnedMessagesBar.jsx";
import { PinnedMessagesDrawer } from "@/app/UiComponents/DataViewer/chat/components/window/PinnedMessagesDrawer.jsx";

const MAX_PINNED = 20;

export default function PinnedMessages({
  roomId,
  handleJumpToMessage,
  loadingJumpToMessage,
  chatContainerRef,
  pinnedMessages,
  loadingPinnedMessages,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  const lastScrollTop = useRef(0);

  const displayedMessages = useMemo(() => {
    const sorted = [...(pinnedMessages || [])].sort(
      (a, b) => (b?.id || 0) - (a?.id || 0)
    );
    return sorted.slice(0, MAX_PINNED);
  }, [pinnedMessages]);

  const currentMessage = displayedMessages[currentIndex];

  const clampIndex = useCallback(
    (idx) => {
      if (!displayedMessages.length) return 0;
      return Math.max(0, Math.min(idx, displayedMessages.length - 1));
    },
    [displayedMessages.length]
  );

  // Keep currentIndex valid when list updates
  useEffect(() => {
    setCurrentIndex((prev) => clampIndex(prev));
  }, [clampIndex]);

  // ===== Navigation core =====
  const navigateToMessage = async (index, options = {}) => {
    const { autoAdvance = false, closeDrawer = false } = options;

    const targetIndex = clampIndex(index);
    const target = displayedMessages[targetIndex];
    if (!target) return;

    setIsNavigating(true);
    setCurrentIndex(targetIndex);

    try {
      await handleJumpToMessage(target.id);
    } finally {
      // WhatsApp-like: after jump, show NEXT pinned in bar (if exists)
      const nextIndex = autoAdvance ? clampIndex(targetIndex + 1) : targetIndex;

      // give the chat a moment to settle so scroll listener doesn’t fight
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setIsNavigating(false);
        if (closeDrawer) setDrawerOpen(false);
      }, 350);
    }
  };

  // Reversed logic:
  // Arrow UP = NEXT (index + 1)
  // Arrow DOWN = PREV (index - 1)
  const handleNext = () => {
    if (currentIndex < displayedMessages.length - 1) {
      navigateToMessage(currentIndex + 1, { autoAdvance: false });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigateToMessage(currentIndex - 1, { autoAdvance: false });
    }
  };

  const handleMessageClick = (messageId) => {
    const idx = displayedMessages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    // click pinned message -> jump then render NEXT on bar
    navigateToMessage(idx, { autoAdvance: true, closeDrawer: true });
  };

  const toggleDrawer = () => setDrawerOpen((v) => !v);

  // ===== Scroll detection (final behavior) =====
  useEffect(() => {
    if (!chatContainerRef?.current || displayedMessages.length === 0) return;

    const container = chatContainerRef.current;

    // activation line from top of container
    const ACTIVATE_OFFSET = 60;

    const isInActivationLine = (rect, containerRect) => {
      const lineY = containerRect.top + ACTIVATE_OFFSET;
      return rect.top <= lineY && rect.bottom >= lineY;
    };

    const handleScroll = () => {
      if (isNavigating) return;

      const scrollTop = container.scrollTop;
      const scrollingUp = scrollTop < lastScrollTop.current; // going to TOP (older)
      const scrollingDown = scrollTop > lastScrollTop.current; // going to BOTTOM (newer)
      lastScrollTop.current = scrollTop;

      const containerRect = container.getBoundingClientRect();

      // 1) scrolling UP: when you pass current pinned -> go NEXT (index + 1)
      if (scrollingUp) {
        const el = document.getElementById(`message-${currentMessage?.id}`);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const messageIsBelowViewport = rect.top > containerRect.bottom;

        if (
          messageIsBelowViewport &&
          currentIndex < displayedMessages.length - 1
        ) {
          setCurrentIndex((prev) =>
            Math.min(prev + 1, displayedMessages.length - 1)
          );
        }
        return;
      }

      // 2) scrolling DOWN: when you REACH a pinned message -> make it active
      if (scrollingDown) {
        let best = null;

        for (let i = 0; i < displayedMessages.length; i++) {
          const msg = displayedMessages[i];
          const el = document.getElementById(`message-${msg.id}`);
          if (!el) continue;

          const rect = el.getBoundingClientRect();
          if (!isInActivationLine(rect, containerRect)) continue;

          const lineY = containerRect.top + ACTIVATE_OFFSET;
          const dist = Math.abs(rect.top - lineY);

          if (!best || dist < best.dist) best = { index: i, dist };
        }

        if (best && best.index !== currentIndex) {
          setCurrentIndex(best.index);
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [
    chatContainerRef,
    displayedMessages,
    currentMessage?.id,
    currentIndex,
    isNavigating,
  ]);

  // Don't show if no pinned messages
  if (displayedMessages.length === 0) return null;

  return (
    <>
      {/* WhatsApp-style Pinned Message Bar */}
      <PinnedMessagesBar
        currentMessage={currentMessage}
        currentIndex={currentIndex}
        displayedMessages={displayedMessages}
        isNavigating={isNavigating}
        loadingJumpToMessage={loadingJumpToMessage}
        navigateToMessage={navigateToMessage}
        handleNext={handleNext}
        handlePrevious={handlePrevious}
        toggleDrawer={toggleDrawer}
      />

      {/* Drawer */}
      <PinnedMessagesDrawer
        drawerOpen={drawerOpen}
        toggleDrawer={toggleDrawer}
        loadingPinnedMessages={loadingPinnedMessages}
        displayedMessages={displayedMessages}
        currentIndex={currentIndex}
        handleMessageClick={handleMessageClick}
        pinnedMessages={pinnedMessages}
        maxPinned={MAX_PINNED}
      />
    </>
  );
}
