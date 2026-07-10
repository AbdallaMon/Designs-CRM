"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

// Enhanced Color Picker with color wheel
const ColorPicker = ({ label, value, onChange, disabled = false }) => {
  const [showColorInput, setShowColorInput] = useState(false);
  const [tempColor, setTempColor] = useState(value || "#ffffff");

  const handleColorSubmit = () => {
    onChange(tempColor);
    setShowColorInput(false);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ mb: 1, opacity: disabled ? 0.5 : 1 }}>
        {label}
      </Typography>

      {/* Current color display */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Box
          sx={{
            width: 40,
            height: 30,
            backgroundColor: value,
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          onClick={() => !disabled && setShowColorInput(true)}
        />
        <Typography variant="body2">{value}</Typography>
      </Box>

      {/* Color input dialog */}
      <Dialog open={showColorInput} onClose={() => setShowColorInput(false)}>
        <DialogTitle>Choose Color</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="Hex Color"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              placeholder="#ffffff"
              fullWidth
              sx={{ mb: 2 }}
            />
            <input
              type="color"
              value={tempColor}
              onChange={(e) => setTempColor(e.target.value)}
              style={{
                width: "100%",
                height: "50px",
                border: "none",
                borderRadius: "4px",
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowColorInput(false)}>Cancel</Button>
          <Button onClick={handleColorSubmit} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ColorPicker;
