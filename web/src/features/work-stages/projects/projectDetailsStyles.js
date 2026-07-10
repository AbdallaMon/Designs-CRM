import {
  Box,
  Button,
  Card,
  Chip,
  LinearProgress,
  styled,
  alpha,
} from "@mui/material";

// Styled components
export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  overflow: "visible",
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 10,
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "none",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
  },
}));

export const InfoCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: 14,
  border: `1px solid ${theme.palette.divider}`,
  transition: "box-shadow 0.2s ease, border-color 0.2s ease",
  "&:hover": {
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
  minWidth: 160,
}));

export const PriorityChip = styled(Chip)(({ theme, priority }) => ({
  borderRadius: 12,
  height: 32,
  fontWeight: 600,
  marginLeft: theme.spacing(1),
}));

export const StyledProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 6,
  backgroundColor: theme.palette.grey[200],
  "& .MuiLinearProgress-bar": {
    borderRadius: 6,
  },
}));

export const ProgressDot = styled(Box)(({ theme, active }) => ({
  width: 14,
  height: 14,
  borderRadius: "50%",
  backgroundColor: active
    ? theme.palette.primary.main
    : theme.palette.grey[300],
  transition: "all 0.3s ease",
  transform: active ? "scale(1.1)" : "scale(1)",
  boxShadow: active
    ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.18)}`
    : "none",
}));

export const StyledDesignerCard = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.25),
  padding: theme.spacing(1.75),
  backgroundColor: theme.palette.background.paper,
  borderRadius: 14,
  border: `1px solid ${theme.palette.divider}`,
  width: "100%",
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
}));
