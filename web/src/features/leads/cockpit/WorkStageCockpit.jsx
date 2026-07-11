"use client";
// WorkStageCockpit — the designer/executor "what do I do next" strip on PreviewWorkStage.
//
// Renders the backend `workStageActions` (language-neutral signals of type
// WORK_STAGE_ASSIGNED_TO_YOU, already scoped to the caller's own assignments). Copy is
// resolved here, mirroring the sales cockpit's config → English pattern.
import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import { MdTimeline } from "react-icons/md";

// Production project type → human label (the handful of production stage types).
const PROJECT_TYPE_LABEL = {
  "3D_Designer": "3D design",
  "3D_Modification": "3D modification",
  "2D_Study": "2D study",
  "2D_Final_Plans": "2D final plans",
  "2D_Quantity_Calculation": "2D quantities",
};

function label(projectType) {
  return PROJECT_TYPE_LABEL[projectType] || projectType || "work";
}

export function WorkStageCockpit({ actions = [] }) {
  const theme = useTheme();
  if (!actions?.length) return null;

  return (
    <Stack spacing={1} sx={{ mb: 2 }}>
      {actions.map((a, i) => (
        <Box
          key={i}
          sx={{
            p: { xs: 1.25, md: 1.5 },
            borderRadius: 2.5,
            display: "flex",
            gap: 1.25,
            alignItems: "center",
            border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
            bgcolor: alpha(theme.palette.warning.main, 0.08),
          }}
        >
          <Box sx={{ color: theme.palette.warning.main, display: "flex", fontSize: 20 }}>
            <MdTimeline />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
              {`Your ${label(a.params?.projectType)} stage is in progress`}
            </Typography>
            {a.params?.level && (
              <Typography variant="caption" color="text.secondary">
                {a.params.level}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Stack>
  );
}
