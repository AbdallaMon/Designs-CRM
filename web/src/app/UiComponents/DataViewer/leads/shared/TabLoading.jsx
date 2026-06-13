import { Box, CircularProgress } from "@mui/material";

/**
 * Lightweight centered loader shown while a lead-detail tab fetches its slice for the
 * first time. Cached tabs skip this on revisit (data already in the provider).
 */
export function TabLoading({ minHeight = 220 }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight,
        width: "100%",
      }}
    >
      <CircularProgress size={32} thickness={4} />
    </Box>
  );
}
