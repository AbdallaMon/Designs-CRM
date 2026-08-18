"use client";

import { Box, ButtonBase, IconButton, Tooltip, Typography } from "@mui/material";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

export function formatKanbanStatus(status) {
  return String(status ?? "").replace(/_/g, " ");
}

export default function KanbanStatusNavigator({
  statuses,
  activeIndex,
  onSelect,
  onPrevious,
  onNext,
}) {
  const lastIndex = Math.max(0, statuses.length - 1);
  const safeIndex = Math.min(Math.max(activeIndex, 0), lastIndex);

  return (
    <Box
      component="nav"
      aria-label="Kanban column navigator"
      sx={{
        mx: 1.5,
        mb: 1,
        px: 0.75,
        py: 0.5,
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        bgcolor: "background.paper",
        boxShadow: "0 1px 3px rgba(42,34,26,0.08)",
      }}
    >
      <Tooltip title="Previous column">
        <span>
          <IconButton
            aria-label="Previous column"
            size="small"
            disabled={safeIndex === 0 || statuses.length < 2}
            onClick={onPrevious}
          >
            <MdChevronLeft />
          </IconButton>
        </span>
      </Tooltip>

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          gap: 0.5,
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {statuses.map((status, index) => {
          const active = index === safeIndex;
          return (
            <ButtonBase
              key={status}
              aria-current={active ? "step" : undefined}
              onClick={() => onSelect(index)}
              sx={{
                minHeight: 32,
                flexShrink: 0,
                px: 1.25,
                borderRadius: "9px",
                border: "1px solid",
                borderColor: active ? "primary.main" : "divider",
                color: active ? "primary.contrastText" : "text.secondary",
                bgcolor: active ? "primary.main" : "transparent",
                transition: "background-color 0.15s ease, color 0.15s ease",
                "&:hover": {
                  bgcolor: active ? "primary.dark" : "action.hover",
                },
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: active ? 700 : 600 }}>
                {formatKanbanStatus(status)}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}
      >
        {statuses.length ? safeIndex + 1 : 0}/{statuses.length}
      </Typography>

      <Tooltip title="Next column">
        <span>
          <IconButton
            aria-label="Next column"
            size="small"
            disabled={safeIndex >= lastIndex || statuses.length < 2}
            onClick={onNext}
          >
            <MdChevronRight />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

