import { Paper, Stack, Typography, useTheme } from "@mui/material";

export const InfoCard = ({ title, icon: Icon, children }) => {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        "&:hover": {
          boxShadow: theme.shadows[2],
          transition: "box-shadow 0.3s ease-in-out",
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Icon size={18} color={theme.palette.primary.main} />
          <Typography variant="subtitle1">{title}</Typography>
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
};
