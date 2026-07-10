// primitives.jsx
// Presentational UI atoms extracted from ContractSession.jsx (behavior-preserving).
import React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { splitFirstSentence } from "./sessionHelpers";

// -----------------------------
// UI atoms
// -----------------------------
export function SectionCard({ title, children, action, dense }) {
  return (
    <Card variant="outlined" sx={{ overflow: "hidden" }}>
      {title && (
        <CardHeader
          title={<Typography variant="h6">{title}</Typography>}
          action={action}
          sx={{
            "& .MuiCardHeader-title": { fontWeight: 700 },
            py: dense ? 1 : 2,
          }}
        />
      )}
      <Divider />
      <CardContent sx={{ p: dense ? 2 : 3 }}>{children}</CardContent>
    </Card>
  );
}

export function KeyValue({ label, value, isRtlValue }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="space-between"
      sx={{ width: "100%" }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        sx={{ direction: isRtlValue ? "rtl" : "ltr", textAlign: "right" }}
      >
        {value ?? "-"}
      </Typography>
    </Stack>
  );
}

export function BulletText({ text }) {
  return (
    <Typography
      variant="body2"
      sx={{ whiteSpace: "pre-line", lineHeight: 1.9 }}
    >
      {text}
    </Typography>
  );
}

// ClauseCard: NO collapse/show-more — always show full text. Lighter background.
export function ClauseCard({ title, text, theme, isRtl }) {
  const [first, rest] = splitFirstSentence(text);
  // use a subtle tinted background (lighter than action.hover)
  const bg = alpha(theme.palette.primary.main, 0.03);
  return (
    <Box
      sx={{
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        p: 2,
        borderRadius: 1,
        mb: 1.5,
        backgroundColor: bg,
      }}
    >
      {title && (
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {title}
        </Typography>
      )}
      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
        <strong>{first}</strong>
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
        {rest ? <span style={{ whiteSpace: "pre-line" }}> {rest}</span> : null}
      </Typography>
    </Box>
  );
}
