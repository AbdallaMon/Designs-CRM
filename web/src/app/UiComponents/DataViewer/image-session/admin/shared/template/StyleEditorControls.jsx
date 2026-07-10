"use client";
import React, { memo } from "react";
import {
  Grid,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import ColorPicker from "@/app/UiComponents/DataViewer/image-session/admin/shared/template/ColorPicker.jsx";
import EnhancedSlider from "@/app/UiComponents/DataViewer/image-session/admin/shared/template/EnhancedSlider.jsx";

/**
 * Memoized component for all styling controls to prevent unnecessary re-renders.
 */
const StyleEditorControls = memo(
  ({
    element,
    customStyles,
    onStyleUpdate,
    template,
    onTemplateChange,
    setTemplate,
    type,
  }) => {
    const { key, label } = element;
    const styles = customStyles[key] || {};

    const handleUpdate = (property, value, saveAsPx = false) => {
      if (saveAsPx) {
        value = `${parseInt(value, 10) || 0}px`;
      }
      onStyleUpdate(key, property, value);
    };

    // Shadow logic encapsulated
    const shadowIntensity = parseInt(styles.boxShadow?.split(" ")[1]) || 0;
    const shadowColor = styles.shadowColor || "rgba(0,0,0,0.3)";

    const handleShadowIntensityChange = (value) => {
      const newBoxShadow = `0 ${value}px ${value * 2}px ${shadowColor}`;
      onStyleUpdate(key, "boxShadow", newBoxShadow);
    };

    const handleShadowColorChange = (color) => {
      onStyleUpdate(key, "shadowColor", color);
      const intensity = parseInt(styles.boxShadow?.split(" ")[1]) || 0;
      if (intensity > 0) {
        const newBoxShadow = `0 ${intensity}px ${intensity * 2}px ${color}`;
        onStyleUpdate(key, "boxShadow", newBoxShadow);
      }
    };

    const renderChangeLayout = () => {
      const current = template.colorsLayout;
      const layouts = ["vertical", "horizontal"];
      return (
        <Select
          value={current}
          onChange={(e) => {
            setTemplate((old) => ({ ...old, colorsLayout: e.target.value }));
          }}
          fullWidth
        >
          {layouts.map((lay) => (
            <MenuItem key={lay} value={lay}>
              {lay}
            </MenuItem>
          ))}
        </Select>
      );
    };

    return (
      <Grid container spacing={2}>
        {/* --- General Section --- */}
        <Grid item xs={12}>
          {" "}
          <Typography variant="overline">General</Typography>{" "}
        </Grid>
        <Grid size={{ sm: 6 }}>
          <ColorPicker
            label="Background Color"
            value={styles.backgroundColor || "transparent"}
            onChange={(color) => handleUpdate("backgroundColor", color)}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <ColorPicker
            label="Text Color"
            value={styles.color || "#333333"}
            onChange={(color) => handleUpdate("color", color)}
          />
        </Grid>
        <Grid size={{ sm: 6 }}>
          <EnhancedSlider
            label="Border Radius"
            value={styles.borderRadius}
            onChange={(val) => handleUpdate("borderRadius", val, true)}
            min={0}
            max={50}
          />
        </Grid>

        <Grid size={{ sm: 6 }}>
          <EnhancedSlider
            label="Shadow Intensity"
            value={shadowIntensity}
            onChange={handleShadowIntensityChange}
            min={0}
            max={50}
          />
        </Grid>
        <Grid item xs={12}>
          <ColorPicker
            label="Shadow Color"
            value={shadowColor}
            onChange={handleShadowColorChange}
          />
        </Grid>

        {key === "colors" && (
          <Grid item xs={12}>
            <Typography variant="overline">Colors Layout</Typography>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} sm={6}>
                {" "}
                {renderChangeLayout()}{" "}
              </Grid>
              <Grid size={{ sm: 6 }}>
                <EnhancedSlider
                  label="Color Circle Size"
                  value={template.colorSize}
                  onChange={(val) => onTemplateChange("colorSize", val)}
                  min={0}
                  max={100}
                />
              </Grid>
              <Grid size={{ sm: 6 }}>
                <EnhancedSlider
                  label="Color Circle gap"
                  value={styles.gap || 0.5}
                  onChange={(val) => handleUpdate("gap", val, true)}
                  min={0}
                  max={100}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="overline">Typography</Typography>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid size={{ sm: 6 }}>
              <EnhancedSlider
                label="Font Size"
                value={styles.fontSize}
                onChange={(val) => handleUpdate("fontSize", val, true)}
                min={10}
                max={48}
              />
            </Grid>
            <Grid size={{ sm: 6 }}>
              <Typography gutterBottom>Font Weight</Typography>
              <Select
                value={styles.fontWeight || 400}
                onChange={(e) => handleUpdate("fontWeight", e.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value={300}>Light</MenuItem>
                <MenuItem value={400}>Regular</MenuItem>
                <MenuItem value={500}>Medium</MenuItem>
                <MenuItem value={700}>Bold</MenuItem>
                <MenuItem value={900}>Black</MenuItem>
              </Select>
            </Grid>
          </Grid>
        </Grid>

        {/* --- Spacing Section --- */}
        <Grid item xs={12}>
          <Typography variant="overline">Spacing</Typography>
        </Grid>
        <Grid size={{ sm: 6 }}>
          <EnhancedSlider
            label="Padding X (Horizontal)"
            value={styles.paddingX}
            onChange={(val) => handleUpdate("paddingX", val, true)}
            min={0}
            max={300}
          />
        </Grid>
        <Grid size={{ sm: 6 }}>
          <EnhancedSlider
            label="Padding Y (Vertical)"
            value={styles.paddingY}
            onChange={(val) => handleUpdate("paddingY", val, true)}
            min={0}
            max={300}
          />
        </Grid>
        <>
          <Grid size={{ xs: 6, sm: 3 }}>
            <EnhancedSlider
              label="Margin Top"
              value={styles.marginTop}
              onChange={(val) => handleUpdate("marginTop", val, true)}
              min={0}
              max={300}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <EnhancedSlider
              label="Margin Bottom"
              value={styles.marginBottom}
              onChange={(val) => handleUpdate("marginBottom", val, true)}
              min={0}
              max={300}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <EnhancedSlider
              label="Margin Left"
              value={styles.marginLeft}
              onChange={(val) => handleUpdate("marginLeft", val, true)}
              min={0}
              max={300}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <EnhancedSlider
              label="Margin Right"
              value={styles.marginRight}
              onChange={(val) => handleUpdate("marginRight", val, true)}
              min={0}
              max={300}
            />
          </Grid>
        </>
      </Grid>
    );
  }
);

StyleEditorControls.displayName = "StyleEditorControls";

export default StyleEditorControls;
