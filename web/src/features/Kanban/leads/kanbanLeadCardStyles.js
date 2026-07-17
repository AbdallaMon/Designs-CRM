import { Box, Card } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== "borderColor",
})(({ theme, borderColor }) => ({
  marginTop: theme.spacing(2.5),
  marginBottom: theme.spacing(0.5),
  borderRadius: "12px",
  border: "1px solid",
  borderColor: theme.palette.divider,
  borderTop: `3px solid ${borderColor}`,
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  position: "relative",
  cursor: "grab",
  overflow: "unset",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 1px 3px rgba(42, 34, 26, 0.06)",
  "& .MuiCardContent-root": {
    padding: theme.spacing(1.5),
    paddingTop: theme.spacing(1.75),
    overflow: "hidden",
    "&:last-child": {
      paddingBottom: theme.spacing(1.5),
    },
  },
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 8px 24px rgba(42, 34, 26, 0.14)",
    borderColor: `${borderColor}66`,
  },
  "&:active": {
    cursor: "grabbing",
  },
}));

export const CallInfoBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "variant",
})(({ theme, variant }) => ({
  padding: theme.spacing(1.25),
  borderRadius: "10px",
  backgroundColor: variant === "next" ? "#e8f1fb" : "#f7f0e8",
  border: `1px solid ${variant === "next" ? "#bcd6f0" : "#e5dcd1"}`,
  marginTop: theme.spacing(1),
}));
