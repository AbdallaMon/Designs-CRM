import { Box, Button, CircularProgress, Typography } from "@mui/material";

export function LoadMoreButton({ onClick, disabled, loadingMore }) {
  return (
    <Box mb={1} display="flex" justifyContent="center">
      {disabled && !loadingMore ? (
        <Typography variant="body2" color="textSecondary">
          لا يمكن تحميل المزيد.
        </Typography>
      ) : (
        <Button
          variant="outlined"
          onClick={() => {
            if (!disabled && !loadingMore) onClick();
          }}
          disabled={disabled || loadingMore}
        >
          {loadingMore && <CircularProgress size={16} style={{ marginInlineEnd: 8 }} />}
          {loadingMore ? "جاري التحميل..." : "تحميل المزيد"}
        </Button>
      )}
    </Box>
  );
}
