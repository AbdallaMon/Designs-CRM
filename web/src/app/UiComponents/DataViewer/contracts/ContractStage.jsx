"use client";

import { contractLevel, contractLevelStatus } from "@/app/helpers/constants";
import {
  Box,
  Card,
  CardContent,
  lighten,
  Typography,
  useTheme,
  Stack,
  alpha,
} from "@mui/material";
import { Grid } from "@mui/material";
import ChipWithIcon from "@/app/UiComponents/DataViewer/utility/ChipWithIcon.jsx";

export default function ContractStage({ stage, index }) {
  const theme = useTheme();
  const conf = contractLevel[stage.title];
  const isCurrent = stage.stageStatus === "IN_PROGRESS";
  const isCompleted = stage.stageStatus === "COMPLETED";
  const statusConf = contractLevelStatus[stage.stageStatus];

  const bgColor = theme.palette[conf.pallete]?.[conf.shade] || "#f5f5f5";
  const statusColor = isCurrent
    ? theme.palette.success.main
    : isCompleted
    ? theme.palette.info.main
    : theme.palette.action.disabled;

  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card
        sx={{
          height: "100%",
          backgroundColor: lighten(isCurrent ? "#4caf50" : bgColor, 0.9),
          border: `2px solid ${
            isCurrent
              ? theme.palette.success.main
              : isCompleted
              ? theme.palette.info.main
              : theme.palette.divider
          }`,
          borderRadius: 2,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.shadows[4],
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background:
              isCurrent || isCompleted
                ? `linear-gradient(90deg, ${statusColor}, ${lighten(
                    statusColor,
                    0.4
                  )})`
                : "transparent",
            borderRadius: "2px",
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={1.5}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Box flex={1}>
                <Typography
                  color={conf.pallete}
                  variant="subtitle2"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  {conf.name}
                </Typography>
                <Typography
                  color={conf.pallete}
                  variant="subtitle2"
                  component="div"
                  sx={{
                    fontWeight: 600,
                    mt: 1,
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  {stage.title}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ pt: 0.5 }}>
              <ChipWithIcon conf={statusConf} />
            </Box>

            {isCurrent && (
              <Box
                sx={{
                  mt: 1,
                  px: 1.5,
                  py: 0.75,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  borderRadius: 1,
                  borderLeft: `3px solid ${theme.palette.success.main}`,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.success.main,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  ● Active Stage
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
}
