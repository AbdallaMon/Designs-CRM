"use client";
import React from "react";
import { Box, Typography, IconButton, ButtonGroup } from "@mui/material";
import {
  MdDragIndicator as DragIndicator,
  MdArrowUpward as ArrowUp,
  MdArrowDownward as ArrowDown,
} from "react-icons/md";

// Layout editor for positioning elements
const LayoutEditor = ({ layout, onLayoutChange }) => {
  const moveElement = (fromIndex, toIndex) => {
    const newLayout = [...layout];
    const [movedElement] = newLayout.splice(fromIndex, 1);
    newLayout.splice(toIndex, 0, movedElement);
    onLayoutChange(newLayout);
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Element Order (Drag to reorder)
      </Typography>
      {layout.map((element, index) => (
        <Box
          key={element}
          sx={{
            display: "flex",
            alignItems: "center",
            p: 1,
            mb: 1,
            border: "1px solid #ddd",
            borderRadius: 1,
            backgroundColor: "#f5f5f5",
          }}
        >
          <DragIndicator sx={{ mr: 1, cursor: "grab" }} />
          <Typography sx={{ flex: 1, textTransform: "capitalize" }}>
            {element === "consButton" ? "View cons and pros" : element}
          </Typography>
          <ButtonGroup size="small">
            <IconButton
              disabled={index === 0}
              onClick={() => moveElement(index, index - 1)}
            >
              <ArrowUp />
            </IconButton>
            <IconButton
              disabled={index === layout.length - 1}
              onClick={() => moveElement(index, index + 1)}
            >
              <ArrowDown />
            </IconButton>
          </ButtonGroup>
        </Box>
      ))}
    </Box>
  );
};

export default LayoutEditor;
