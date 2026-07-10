"use client";
import React, { memo } from "react";
import { Box, Typography, Grid, Input } from "@mui/material";

const EnhancedSlider = memo(
  ({ label, value, onChange, min, max, step = 1, unit = "px" }) => {
    const numericValue = parseInt(value) || 0;

    const handleInputChange = (event) => {
      const val = event.target.value === "" ? "" : Number(event.target.value);
      onChange(val);
    };

    const handleBlur = () => {
      if (numericValue < min) onChange(min);
      else if (numericValue > max) onChange(max);
    };

    return (
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>
          {label}: {numericValue}
          {unit}
        </Typography>
        <Grid container spacing={2} alignItems="center">
          {/* <Grid item xs>
            <Slider
              value={numericValue}
              onChange={handleSliderChange}
              min={min}
              max={max}
              step={step}
              valueLabelDisplay="auto"
              valueLabelFormat={(val) => `${val}${unit}`}
            />
          </Grid> */}
          <Grid>
            <Input
              value={numericValue}
              size="small"
              onChange={handleInputChange}
              onBlur={handleBlur}
              inputProps={{ step, min, max, type: "number" }}
              sx={{ width: "100%", minWidth: "150px" }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }
);

EnhancedSlider.displayName = "EnhancedSlider";

export default EnhancedSlider;
