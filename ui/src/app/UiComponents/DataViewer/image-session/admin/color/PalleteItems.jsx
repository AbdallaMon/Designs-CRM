import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Checkbox,
  FormControlLabel,
  Typography,
  Popover,
} from "@mui/material";
import { MdAdd, MdDelete } from "react-icons/md";
import {
  HexAlphaColorPicker,
  HexColorInput,
  HexColorPicker,
} from "react-colorful";
import debounce from "lodash.debounce"; // Import debounce
import { useDebounce } from "../shared/CreateTitleOrDesc";

function ColorSelector({
  color,
  onChange,
  onDelete,
  onEditableToggle,
  isEditable,
  canDelete = true,
}) {
  // Ref to access the hidden color input element
  const colorInputRef = useRef(null);

  // Local state for the immediate, un-debounced color value
  const [currentColor, setCurrentColor] = useState(color);

  // Get the debounced value from our hook
  const debouncedColor = useDebounce(currentColor, 200);

  // Effect to call the parent's onChange with the debounced value
  useEffect(() => {
    if (color !== debouncedColor) {
      onChange(debouncedColor);
    }
  }, [debouncedColor]);

  // Handler for the native color input
  const handleColorInputChange = (e) => {
    setCurrentColor(e.target.value);
  };

  // When the swatch is clicked, programmatically click the hidden input
  const handleSwatchClick = () => {
    colorInputRef.current?.click();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1,
        p: 1,
        border: "1px solid #ddd",
        borderRadius: 1,
      }}
    >
      {/* The visible color swatch */}
      <Box
        sx={{
          width: 40,
          height: 40,
          backgroundColor: color, // Shows the final, debounced color
          border: "1px solid #ccc",
          borderRadius: 1,
          cursor: "pointer",
        }}
        onClick={handleSwatchClick}
      />

      {/* The hidden native color input */}
      <input
        ref={colorInputRef}
        type="color"
        value={currentColor}
        onChange={handleColorInputChange}
        style={{ display: "none" }}
      />

      <Typography
        variant="body2"
        sx={{ minWidth: 80, fontFamily: "monospace" }}
      >
        {color}
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={isEditable}
            onChange={onEditableToggle}
            size="small"
          />
        }
        label="Editable"
        sx={{ ml: 1 }}
      />

      {canDelete && (
        <IconButton
          onClick={onDelete}
          size="small"
          color="error"
          sx={{ ml: "auto" }}
        >
          <MdDelete />
        </IconButton>
      )}
    </Box>
  );
}
// Create Color Pattern Component
export function CreateColorPattern({ data, setData }) {
  const [colors, setColors] = useState(
    (data && data.colors) || [
      { colorHex: "#FF0000", isEditableByClient: false },
      { colorHex: "#00FF00", isEditableByClient: false },
      { colorHex: "#0000FF", isEditableByClient: false },
      { colorHex: "#FFFF00", isEditableByClient: false },
      { colorHex: "#FF00FF", isEditableByClient: false },
    ]
  );

  const updateDataWithColors = (newColors) => {
    setColors(newColors);
    setData((prev) => ({
      ...prev,
      colors: newColors,
    }));
  };

  const addColor = () => {
    const newColors = [
      ...colors,
      { colorHex: "#000000", isEditableByClient: false },
    ];
    updateDataWithColors(newColors);
  };

  const deleteColor = (index) => {
    if (colors.length > 1) {
      // Keep at least one color
      const newColors = colors.filter((_, i) => i !== index);
      updateDataWithColors(newColors);
    }
  };

  const updateColor = (index, newColor) => {
    const newColors = colors.map((color, i) =>
      i === index ? { ...color, colorHex: newColor } : color
    );
    updateDataWithColors(newColors);
  };

  const toggleEditable = (index) => {
    const newColors = colors.map((color, i) =>
      i === index
        ? { ...color, isEditableByClient: !color.isEditableByClient }
        : color
    );
    updateDataWithColors(newColors);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Typography variant="h6" gutterBottom>
        Color Pattern ({colors.length} colors)
      </Typography>

      {colors.map((color, index) => (
        <ColorSelector
          key={index}
          color={color.colorHex}
          isEditable={color.isEditableByClient}
          onChange={(newColor) => updateColor(index, newColor)}
          onDelete={() => deleteColor(index)}
          onEditableToggle={() => toggleEditable(index)}
          canDelete={colors.length > 1}
        />
      ))}

      <Button
        onClick={addColor}
        startIcon={<MdAdd />}
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
      >
        Add Color
      </Button>
    </Box>
  );
}

// Edit Color Pattern Component - for editing existing color patterns
export function EditColorPattern({ data, setData, initialColors = [] }) {
  // Local state for rendering the UI, initialized with server data
  const [colors, setColors] = useState(() => {
    // Ensure initialColors is always an array
    return Array.isArray(initialColors) ? initialColors : [];
  });

  // Function to add a brand new color
  const addColor = () => {
    // Create a new color object with a temporary unique ID for tracking
    const newColor = {
      tempId: crypto.randomUUID(), // Use a unique ID for client-side tracking
      colorHex: "#000000",
      isEditableByClient: false,
    };

    // Update the local UI state
    setColors((current) => [...current, newColor]);

    // Update the parent state to track this as a new addition
    setData((prev) => ({
      ...prev,
      newColors: [...(prev.newColors || []), newColor],
    }));
  };

  // Function to delete a color
  const deleteColor = (index) => {
    if (colors.length <= 1) return; // Keep at least one color

    const colorToDelete = colors[index];

    // Update the local UI state by filtering out the deleted color
    setColors((current) => current.filter((_, i) => i !== index));

    // Update the parent state to track the deletion
    setData((prev) => {
      const { newColors = [], editedColors = [], deletedColors = [] } = prev;

      // If the color has a real 'id', it's an existing color that needs to be marked for deletion
      if (colorToDelete.id) {
        return {
          ...prev,
          // Add its id to the list of deleted colors
          deletedColors: [...deletedColors, colorToDelete.id],
          // Also, remove it from the 'edited' list if it was there
          editedColors: editedColors.filter((c) => c.id !== colorToDelete.id),
        };
      }

      // If it only has a 'tempId', it's a new color that was never saved
      if (colorToDelete.tempId) {
        return {
          ...prev,
          // Just remove it from the 'newColors' list
          newColors: newColors.filter((c) => c.tempId !== colorToDelete.tempId),
        };
      }

      return prev; // No changes if the color has neither id nor tempId
    });
  };

  // Generic function to update any property of a color
  const updateColor = (index, updatedProperties) => {
    const updatedColor = { ...colors[index], ...updatedProperties };

    // Update the local UI state with the modified color
    setColors((current) =>
      current.map((color, i) => (i === index ? updatedColor : color))
    );

    // Update the parent state to track the edit
    setData((prev) => {
      const { newColors = [], editedColors = [] } = prev;

      // If it's an existing color (has a real 'id')
      if (updatedColor.id) {
        // Remove any previous edits of this same color to avoid duplicates
        const otherEditedColors = editedColors.filter(
          (c) => c.id !== updatedColor.id
        );
        return {
          ...prev,
          editedColors: [...otherEditedColors, updatedColor],
        };
      }

      // If it's a new color (has a 'tempId')
      if (updatedColor.tempId) {
        return {
          ...prev,
          // Find and update the color directly in the 'newColors' array
          newColors: newColors.map((c) =>
            c.tempId === updatedColor.tempId ? updatedColor : c
          ),
        };
      }

      return prev;
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Edit Color Pattern ({colors.length} colors)
      </Typography>

      {colors.map((color, index) => (
        <ColorSelector
          // Use a stable, unique key for each item
          key={color.id || color.tempId}
          color={color.colorHex}
          isEditable={color.isEditableByClient}
          // Pass partial updates to the update function
          onChange={(newColorHex) =>
            updateColor(index, { colorHex: newColorHex })
          }
          onEditableToggle={() =>
            updateColor(index, {
              isEditableByClient: !color.isEditableByClient,
            })
          }
          onDelete={() => deleteColor(index)}
          canDelete={colors.length > 1}
        />
      ))}

      <Button
        onClick={addColor}
        startIcon={<MdAdd />}
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
      >
        Add Color
      </Button>
    </Box>
  );
}
