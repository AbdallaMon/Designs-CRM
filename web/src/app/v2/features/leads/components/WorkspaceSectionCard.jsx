"use client";

// <WorkspaceSectionCard> — a SectionCard wrapping the 5-state machine for ONE workspace
// section (UX plan §2 / dashboard WidgetBoundary parity): loading skeleton → error+retry →
// partial-permission notice (403) → role-aware empty → data list. Isolated per card so one
// failed read never blanks the cockpit. Single-language Arabic / RTL.
//
// Props:
//   title      string  — section heading.
//   count      number? — optional badge shown next to the title (e.g. total).
//   viewAll    { label, href }? — optional header-end link to the full list.
//   loading    bool
//   error      string|object?
//   forbidden  bool    — the read 403'd → show a gentle partial-permission notice.
//   onRetry    () => void
//   isEmpty    bool
//   empty      { title?, description?, icon? }
//   children   node    — the rendered list when data is present.

import { Box, Chip, Button } from "@mui/material";
import NextLink from "next/link";
import { MdChevronLeft } from "react-icons/md";
import {
  SectionCard,
  LoadingState,
  ErrorState,
  EmptyState,
  PartialPermissionState,
} from "@/app/v2/shared/components";
import { useT } from "@/app/v2/lib/i18n";
import { leadsMessages } from "../config/leadsMessages.js";

export function WorkspaceSectionCard({
  title,
  count,
  viewAll,
  loading,
  error,
  forbidden,
  onRetry,
  isEmpty,
  empty = {},
  children,
}) {
  const { t } = useT();
  const headerActions = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {typeof count === "number" && !loading && !error && !forbidden && (
        <Chip size="small" color="primary" variant="outlined" label={count} />
      )}
      {viewAll && (
        <Button
          component={NextLink}
          href={viewAll.href}
          size="small"
          color="primary"
          endIcon={<MdChevronLeft />}
        >
          {viewAll.label}
        </Button>
      )}
    </Box>
  );

  return (
    <SectionCard title={title} actions={headerActions}>
      <Box sx={{ minHeight: 160 }}>
        {loading && <LoadingState variant="table" rows={4} columns={3} />}

        {!loading && forbidden && (
          <PartialPermissionState
            title={t("leads.section.denied.title")}
            message={t("leads.section.denied.message")}
          />
        )}

        {!loading && !forbidden && error && (
          <ErrorState error={error} onRetry={onRetry} resolver={leadsMessages} />
        )}

        {!loading && !forbidden && !error && isEmpty && (
          <EmptyState
            title={empty.title ?? t("leads.section.empty.title")}
            description={empty.description}
            icon={empty.icon}
          />
        )}

        {!loading && !forbidden && !error && !isEmpty && children}
      </Box>
    </SectionCard>
  );
}

export default WorkspaceSectionCard;
