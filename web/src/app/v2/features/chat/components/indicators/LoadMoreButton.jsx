import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useT } from "@/app/v2/lib/i18n";

export function LoadMoreButton({ onClick, disabled, loadingMore }) {
  const { t } = useT();
  return (
    <Box mb={1} display="flex" justifyContent="center">
      {disabled && !loadingMore ? (
        <Typography variant="body2" color="textSecondary">
          {t("chat.loadMore.cannot", "لا يمكن تحميل المزيد.")}
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
          {loadingMore ? t("chat.loadMore.loading", "جاري التحميل...") : t("chat.loadMore.action", "تحميل المزيد")}
        </Button>
      )}
    </Box>
  );
}
