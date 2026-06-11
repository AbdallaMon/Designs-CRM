"use client";

// <ReviewCard /> — one read-only Google Business review. Renders reviewer name, a star row
// (from the Google `starRating` enum), the comment, the create date, and an optional business
// reply. Presentational only — no actions. Single-language Arabic / RTL; prose from reviewsUi.
//
// Google review resource (relevant fields): reviewer.displayName, starRating ("ONE".."FIVE"),
// comment, createTime (ISO), reviewReply.comment.
//
// Props:
//   review  object — a Google review resource.

import { Stack, Typography, Box, Avatar, Divider } from "@mui/material";
import { MdStar, MdStarBorder, MdPerson } from "react-icons/md";
import { SectionCard } from "@/app/v2/shared/components";
import { reviewsUi, STAR_RATING_VALUE } from "../config/reviewsMessages.js";

function StarRow({ value }) {
  const filled = STAR_RATING_VALUE[value] ?? 0;
  return (
    <Stack direction="row" spacing={0.25} aria-label={`التقييم ${filled} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Box
          key={n}
          component="span"
          sx={{ color: n <= filled ? "warning.main" : "text.disabled", display: "flex", fontSize: 20 }}
        >
          {n <= filled ? <MdStar /> : <MdStarBorder />}
        </Box>
      ))}
    </Stack>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ReviewCard({ review }) {
  const name = review?.reviewer?.displayName || reviewsUi.anonymousReviewer;
  const date = formatDate(review?.createTime);
  const reply = review?.reviewReply?.comment;

  return (
    <SectionCard>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={review?.reviewer?.profilePhotoUrl} sx={{ width: 40, height: 40 }}>
            <MdPerson />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {name}
            </Typography>
            {date && (
              <Typography variant="caption" color="text.secondary">
                {date}
              </Typography>
            )}
          </Box>
          <Box sx={{ marginInlineStart: "auto" }}>
            <StarRow value={review?.starRating} />
          </Box>
        </Stack>

        {review?.comment && (
          <Typography variant="body2" sx={{ whiteSpace: "pre-line", textAlign: "start" }}>
            {review.comment}
          </Typography>
        )}

        {reply && (
          <Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              {reviewsUi.reviewReplyLabel}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", textAlign: "start" }}>
              {reply}
            </Typography>
          </Box>
        )}
      </Stack>
    </SectionCard>
  );
}

export default ReviewCard;
