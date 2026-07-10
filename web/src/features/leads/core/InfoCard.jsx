import { Box, Paper, Stack, Typography, alpha, useTheme } from "@mui/material";

export const InfoCard = ({ title, icon: Icon, children, action }) => {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        borderColor: alpha(theme.palette.primary.main, 0.15),
        transition: "box-shadow 0.25s ease, border-color 0.25s ease",
        "&:hover": {
          boxShadow: theme.shadows[3],
          borderColor: alpha(theme.palette.primary.main, 0.35),
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: 2.5,
          py: 1.5,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.08
          )} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          {Icon && (
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                color: theme.palette.primary.dark,
              }}
            >
              <Icon size={18} color={theme.palette.primary.dark} />
            </Box>
          )}
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            {title}
          </Typography>
        </Stack>
        {action}
      </Stack>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
};
