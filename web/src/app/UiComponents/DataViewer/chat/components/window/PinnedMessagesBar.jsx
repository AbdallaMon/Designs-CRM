"use client";

import { Box, IconButton, Typography, CircularProgress, Badge, Paper } from "@mui/material";
import {
  MdPushPin,
  MdKeyboardArrowUp,
  MdKeyboardArrowDown,
} from "react-icons/md";
import colors from "@/app/helpers/colors";
import { PinnedMessagePreview } from "./PinnedMessagePreview";

export function PinnedMessagesBar({
  currentMessage,
  currentIndex,
  displayedMessages,
  isNavigating,
  loadingJumpToMessage,
  navigateToMessage,
  handleNext,
  handlePrevious,
  toggleDrawer,
}) {
  return (
    <Paper
      elevation={2}
      sx={{
        top: 60,
        left: 0,
        right: 0,
        zIndex: 1000,
        bgcolor: colors.primary + "15",
        borderBottom: `2px solid ${colors.primary}`,
        display: "flex",
        alignItems: "center",
        px: 2,
        py: 1,
        gap: 1,
      }}
    >
      <MdPushPin size={20} color={colors.primary} />

      {/* Click bar -> jump to current pinned then show NEXT in bar */}
      <Box
        onClick={() => navigateToMessage(currentIndex, { autoAdvance: true })}
        sx={{
          flex: 1,
          cursor: "pointer",
          minWidth: 0,
          "&:hover": { opacity: 0.85 },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: colors.primary,
            fontWeight: "bold",
            display: "block",
          }}
        >
          {currentMessage?.sender?.name || "Unknown User"}
        </Typography>

        <Box
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <PinnedMessagePreview message={currentMessage} />
        </Box>
      </Box>

      {/* Right controls */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            color: colors.primary,
            fontWeight: "bold",
            minWidth: 40,
            textAlign: "center",
          }}
        >
          {currentIndex + 1}/{displayedMessages.length}
        </Typography>

        {/* REVERSED buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* UP = NEXT */}
          <IconButton
            size="small"
            onClick={handleNext}
            disabled={
              currentIndex === displayedMessages.length - 1 || isNavigating
            }
            sx={{
              p: 0.25,
              color: colors.primary,
              "&:disabled": { color: "text.disabled" },
            }}
          >
            <MdKeyboardArrowUp size={20} />
          </IconButton>

          {/* DOWN = PREV */}
          <IconButton
            size="small"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isNavigating}
            sx={{
              p: 0.25,
              color: colors.primary,
              "&:disabled": { color: "text.disabled" },
            }}
          >
            <MdKeyboardArrowDown size={20} />
          </IconButton>
        </Box>

        <IconButton
          size="small"
          onClick={toggleDrawer}
          sx={{ color: colors.primary, ml: 1 }}
        >
          <Badge
            badgeContent={displayedMessages.length}
            color="error"
            max={20}
          >
            <MdPushPin size={20} />
          </Badge>
        </IconButton>
      </Box>

      {(loadingJumpToMessage || isNavigating) && (
        <CircularProgress size={16} sx={{ color: colors.primary }} />
      )}
    </Paper>
  );
}

export default PinnedMessagesBar;
