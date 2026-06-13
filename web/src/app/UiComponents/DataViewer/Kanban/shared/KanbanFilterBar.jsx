"use client";

import React from "react";
import { Box, Typography, Divider } from "@mui/material";
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
  const hasFilters = Boolean(staffSearch) || Boolean(filters);

  return (
    <Box
      sx={{
        mb: 2,
        p: { xs: 1.5, md: 2 },
        backgroundColor: colors.paperBg,
        border: `1px solid ${colors.borderLight}`,
        borderRadius: "16px",
        boxShadow: `0 1px 3px ${colors.shadow}`,
      }}
    >
      {/* Title row + links */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          mb: hasFilters ? 1.5 : 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "8px",
              backgroundColor: colors.primaryAlt,
              color: colors.primaryDark,
              fontSize: 16,
            }}
          >
            <FiFilter />
          </Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: colors.heading,
              letterSpacing: 0.2,
            }}
          >
            Filters
          </Typography>
        </Box>

        {links && (
          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              flex: { xs: "1 1 100%", md: "0 0 auto" },
            }}
          >
            {links}
          </Box>
        )}
      </Box>

      {hasFilters && (
        <Divider sx={{ borderColor: colors.borderLight, mb: 1.5 }} />
      )}

      {/* Controls row: search group | filters group */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-end",
          gap: { xs: 1.5, md: 2 },
          // Normalize the shared inputs so they line up on one baseline.
          // FilterSelect ships an internal `margin="normal"` + `mb: 2`; the
          // DatePicker/Autocomplete inputs use the default outlined height.
          "& .MuiFormControl-root": { m: 0 },
          "& .MuiFormControl-marginNormal": { mt: 0, mb: 0 },
        }}
      >
        {/* Search group */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: { xs: 1.5, md: 2 },
            flex: "1 1 auto",
            minWidth: 0,
          }}
        >
          {leadSearch && (
            <FieldGroup label="Lead">{leadSearch}</FieldGroup>
          )}
          {staffSearch && (
            <FieldGroup label="Staff">{staffSearch}</FieldGroup>
          )}
        </Box>

        {/* Filters group */}
        {filters && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: { xs: 1.5, md: 2 },
              flex: { xs: "1 1 100%", md: "0 0 auto" },
            }}
          >
            {filters}
          </Box>
        )}
      </Box>

      {/* Bulk actions are rendered (and floated) by the parent; we just give
          a hook so the slot stays adjacent in the JSX tree. */}
      {bulkActions}
    </Box>
  );
};

/**
 * Small captioned wrapper so each search/field reads as a labelled control
 * with consistent spacing and a shared baseline.
 */
const FieldGroup = ({ label, children }) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 0.5,
      minWidth: { xs: "100%", sm: "auto" },
    }}
  >
    {label && (
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: colors.textTertiary,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontSize: 10,
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    )}
    {children}
  </Box>
);

export default KanbanFilterBar;
