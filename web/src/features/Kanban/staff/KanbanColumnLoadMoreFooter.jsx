import { Box, Button, Typography } from "@mui/material";

export default function KanbanColumnLoadMoreFooter({
  loading,
  error,
  hasMore,
  hasItems,
  onLoadMore,
  onRetry,
  statusColor,
}) {
  if (!hasItems) return null;

  if (loading) {
    return (
      <Box
        sx={{
          textAlign: "center",
          color: "text.secondary",
          padding: 1.5,
          fontSize: "0.8rem",
        }}
      >
        Loading more...
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", color: "error.main", padding: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Couldn&apos;t load more items.
        </Typography>
        <Button
          onClick={onRetry}
          variant="outlined"
          color="error"
          size="small"
          sx={{ borderRadius: "10px", textTransform: "none" }}
        >
          Retry loading more
        </Button>
      </Box>
    );
  }

  if (!hasMore) return null;

  return (
    <Button
      onClick={onLoadMore}
      variant="outlined"
      fullWidth
      sx={{
        mb: 2,
        borderRadius: "10px",
        textTransform: "none",
        borderColor: `${statusColor}55`,
        color: statusColor,
        "&:hover": {
          borderColor: statusColor,
          bgcolor: `${statusColor}12`,
        },
      }}
    >
      Load more
    </Button>
  );
}
