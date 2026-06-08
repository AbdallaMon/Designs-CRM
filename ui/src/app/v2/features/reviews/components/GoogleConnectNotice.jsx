"use client";

// <GoogleConnectNotice /> — the "ربط مع Google" affordance, gated on review.connect but
// presented DISABLED + informational. The Google OAuth connect is FROZEN and non-functional
// (the frozen services/reviews.js has a stale dev redirect URI + empty client id/secret), and
// the connect is a full-page BROWSER REDIRECT the BE owns — so we do NOT hardcode a Google URL
// and do NOT wire a working flow. Instead we explain "الربط مع Google غير مُفعّل" gracefully.
// Single-language Arabic / RTL. All visible prose comes from reviewsUi (no inline strings).

import { Box, Stack, Typography, Button, Chip } from "@mui/material";
import { MdLink } from "react-icons/md";
import { SectionCard } from "@/app/v2/shared/components";
import { reviewsUi } from "../config/reviewsMessages.js";

export function GoogleConnectNotice() {
  return (
    <SectionCard
      title={reviewsUi.connectTitle}
      actions={
        <Chip size="small" variant="outlined" color="default" label={reviewsUi.connectDisabledChip} />
      }
      sx={{ mb: 3 }}
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          {reviewsUi.connectExplanation}
        </Typography>
        <Box>
          {/* Disabled-with-reason: the CTA stays visible (never a silent dead-end) but is
              inert because the BE-owned OAuth flow is not configured. */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<MdLink />}
            disabled
            sx={{ borderRadius: 2 }}
          >
            {reviewsUi.connectButton}
          </Button>
        </Box>
      </Stack>
    </SectionCard>
  );
}

export default GoogleConnectNotice;
