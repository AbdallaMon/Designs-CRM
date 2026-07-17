"use client";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
} from "@mui/material";

const StatCard = ({ icon, title, value, color, subtitle, gradient = false }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: "100%",
        background: gradient
          ? `linear-gradient(135deg, ${alpha(
              theme.palette[color].main,
              0.1
            )} 0%, ${alpha(theme.palette[color].main, 0.05)} 100%)`
          : "background.paper",
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px ${alpha(theme.palette[color].main, 0.15)}`,
          border: `1px solid ${alpha(theme.palette[color].main, 0.4)}`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
              borderRadius: "16px",
              p: 2,
              mr: 3,
              color: "white",
              boxShadow: `0 8px 16px ${alpha(theme.palette[color].main, 0.3)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box flex={1}>
            <Typography
              variant="h3"
              fontWeight="800"
              sx={{
                background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              {value}
            </Typography>
            <Typography
              variant="body1"
              fontWeight="600"
              color="text.primary"
              sx={{ mb: 0.5 }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  backgroundColor: alpha(theme.palette[color].main, 0.1),
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;
