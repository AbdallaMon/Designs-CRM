"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { FiFilter } from "react-icons/fi";
import colors from "@/app/helpers/colors";

/**
 * Presentational toolbar for the deals kanban.
 *
 * VISUAL/LAYOUT ONLY. It receives already-wired controls as render slots and
 * arranges them in a clean, responsive filter bar. It does NOT own any of the
 * filter/search/bulk logic — every control is passed in by the parent.
 *
 * Slots:
 *  - leadSearch:   the lead SearchComponent (always shown)
 *  - staffSearch:  the staff SearchComponent (optional)
 *  - filters:      the date-range + select controls (optional)
 *  - links:        the TabsWithLinks navigation (optional)
 *  - bulkActions:  the selection/convert controls (optional, floating in parent)
 */
const KanbanFilterBar = ({
  leadSearch,
  staffSearch,
  filters,
  links,
  bulkActions,
}) => {
  return (
    <Box
      component="section"
      aria-label="Board filters"
      data-testid="kanban-filter-bar"
      sx={{
        mb: 1.5,
        p: { xs: 1, sm: 1.25 },
        backgroundColor: colors.paperBg,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: "14px",
        boxShadow: `0 1px 3px ${colors.shadow}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              borderRadius: "7px",
              backgroundColor: colors.primaryAlt,
              color: colors.primaryDark,
              fontSize: 14,
            }}
          >
            <FiFilter aria-hidden="true" />
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: colors.heading,
              fontSize: "0.8125rem",
            }}
          >
            Find & filter
          </Typography>
        </Box>

        {links && (
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              flex: "0 0 auto",
              "& > .MuiBox-root": { p: 0 },
            }}
          >
            {links}
          </Box>
        )}
      </Box>

      <Box
        data-testid="kanban-filter-searches"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: staffSearch
              ? "minmax(280px, 1.25fr) minmax(240px, 1fr)"
              : "minmax(280px, 560px)",
          },
          gap: 1,
          alignItems: "center",
          "& .MuiFormControl-root": { m: 0 },
          "& .MuiFormControl-marginNormal": { mt: 0, mb: 0 },
          "& .MuiAutocomplete-root": { minWidth: "0 !important" },
          "& .MuiInputBase-root": { backgroundColor: colors.paperBg },
        }}
      >
        {leadSearch && <ControlSlot>{leadSearch}</ControlSlot>}
        {staffSearch && <ControlSlot>{staffSearch}</ControlSlot>}
      </Box>

      {filters && (
        <Box
          data-testid="kanban-filter-controls"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
            mt: 1,
            p: 1,
            border: `1px solid ${colors.borderLight}`,
            borderRadius: "10px",
            backgroundColor: colors.bgSecondary,
            "& .MuiFormControl-root": { m: 0 },
            "& .MuiFormControl-marginNormal": { mt: 0, mb: 0 },
            "& .MuiInputBase-root": {
              backgroundColor: colors.paperBg,
              fontSize: "0.8125rem",
            },
            "& .MuiInputLabel-root": { fontSize: "0.8125rem" },
          }}
        >
          {filters}
        </Box>
      )}

      {bulkActions}
    </Box>
  );
};

const ControlSlot = ({ children }) => (
  <Box
    sx={{
      width: "100%",
      minWidth: 0,
    }}
  >
    {children}
  </Box>
);

export default KanbanFilterBar;
