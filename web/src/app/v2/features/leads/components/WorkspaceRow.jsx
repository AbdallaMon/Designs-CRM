"use client";

// <WorkspaceRow> — the compact list-row shell shared by every workspace section. A clickable
// surface that links to the lead hub (/v2/leads/{clientLeadId}) with: a primary line (client
// name), a secondary line (time / meta), an optional status chip, and an optional end-aligned
// action slot. Keeps the 4 section row variants visually consistent. RTL: the action sits at
// the inline-END, the chevron hint points inline-START (toward the lead). Single-language Arabic.
//
// Props:
//   href      string   — the lead hub link (whole row is a link, action excluded).
//   primary   node     — main line (client name).
//   secondary node?    — secondary line (time, reason).
//   chip      node?    — a StatusChip (or any chip) rendered after the primary line.
//   action    node?    — end-aligned primary action (stops link navigation on click).

import { Box, Stack, Typography, Divider } from "@mui/material";
import NextLink from "next/link";
import { MdChevronLeft } from "react-icons/md";

export function WorkspaceRow({ href, primary, secondary, chip, action }) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 1.25,
          px: 0.5,
        }}
      >
        <Box
          component={NextLink}
          href={href}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            color: "inherit",
            borderRadius: 2,
            transition: "background-color 120ms",
            "&:hover": { bgcolor: "action.hover" },
            px: 1,
            py: 0.5,
            mx: -1,
          }}
        >
          <MdChevronLeft style={{ flexShrink: 0, opacity: 0.5 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "text.primary" }}
                noWrap
              >
                {primary}
              </Typography>
              {chip}
            </Stack>
            {secondary && (
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {secondary}
              </Typography>
            )}
          </Box>
        </Box>

        {action && (
          <Box
            sx={{ flexShrink: 0 }}
            // The action lives OUTSIDE the link so clicking it never navigates.
          >
            {action}
          </Box>
        )}
      </Box>
      <Divider sx={{ "&:last-of-type": { display: "none" } }} />
    </>
  );
}

export default WorkspaceRow;
