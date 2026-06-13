import React from "react";
import { Chip, Box } from "@mui/material";
import { MdTag } from "react-icons/md";

const FloatingIdBadge = ({
  leadId,
  backgroundColor = "primary.main",
  color,
}) => {
  const formattedId = `${leadId.toString().padStart(7, "0")}`;

  return (
    <Box
      sx={{
        position: "absolute",
        top: -20,
        left: 0,
        zIndex: 1000,
      }}
    >
      <Chip
        icon={<MdTag sx={{ fontSize: "12px !important" }} />}
        label={formattedId}
        sx={{
          fontWeight: "bold",
          fontSize: "0.875rem",
          color: color,
          bgcolor: backgroundColor,
          borderRadius: "0",
          cursor: "default",
          userSelect: "none",
        }}
      />
    </Box>
  );
};

export default FloatingIdBadge;
