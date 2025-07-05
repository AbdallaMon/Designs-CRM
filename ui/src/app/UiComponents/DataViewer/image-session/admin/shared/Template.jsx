import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
import {
  Box,
  Card,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Slider,
  TextField,
  Grid,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Snackbar,
  InputAdornment,
  ButtonGroup,
  Input,
} from "@mui/material";
import {
  MdVisibility as Visibility,
  MdVisibilityOff as VisibilityOff,
  MdEdit as Edit,
  MdPalette as Palette,
  MdStyle as Style,
  MdTune as Tune,
  MdExpandMore as ExpandMore,
  MdDragIndicator as DragIndicator,
  MdArrowUpward as ArrowUp,
  MdArrowDownward as ArrowDown,
  MdSave as Save,
  MdFileUpload as Upload,
  MdFileDownload as Download,
  MdFormatSize,
} from "react-icons/md";
import colors from "@/app/helpers/colors";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useDebounce } from "./CreateTitleOrDesc";

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

export const PreviewTemplateCard = ({
  template,
  customStyles = {},
  layout = ["title", "description", "consButton", "colors"],
  isEditItem,
  ty,
}) => {
  const cardDimensions = { minWidth: "300px", width: "100%" };
  const cardStyle = {
    position: "relative",
    ...cardDimensions,
    margin: "0 auto",
    backgroundColor: template.backgroundColor || "#f5f5f5",
    borderRadius: template.borderRadius || "8px",
    overflow: "hidden",
    ...customStyles.card,
  };

  // Background image with blur (separate from content)
  const backgroundImageStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: template.backgroundImage
      ? `url(${template.backgroundImage})`
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: template.blurValue > 0 ? `blur(${template.blurValue}px)` : "none",
  };

  // Overlay style
  const overlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: template.overlayColor || "transparent",
    opacity: template.overlayOpacity || 0,
    display: template.showOverlay ? "block" : "none",
  };

  const contentStyle = {
    position: "relative",
    zIndex: 2,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    flexWrap: "nowrap",
    alignItems: "center",
    ...customStyles.content,
    paddingX: template.paddingX || "16px",
    paddingY: template.paddingY || "16px",
  };

  const getElementStyle = (elementType) => {
    const baseStyle = customStyles[elementType] || {};
    return {
      ...baseStyle,
      marginTop: baseStyle.marginTop || "0px",
      marginBottom: baseStyle.marginBottom || "8px",
      marginLeft: baseStyle.marginLeft || "0px",
      marginRight: baseStyle.marginRight || "0px",
    };
  };
  const colorCircles = ["#f44336", "#2196f3", "#4caf50", "#ff9800", "#9c27b0"];
  const renderElement = (elementType) => {
    switch (elementType) {
      case "title":
        return (
          template.showTitle && (
            <Box
              key="title"
              sx={{ position: "relative", ...getElementStyle("title") }}
            >
              <Typography
                variant="h5"
                sx={{
                  textAlign: "center",
                  ...customStyles.title,
                }}
              >
                Template Title
              </Typography>
            </Box>
          )
        );

      case "description":
        return (
          template.showDescription && (
            <Box
              key="description"
              sx={{ position: "relative", ...getElementStyle("description") }}
            >
              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  ...customStyles.description,
                }}
              >
                This is a sample description for the template card.
              </Typography>
            </Box>
          )
        );

      case "consButton":
        return (
          template.showCons && (
            <Box key="consButton">
              <Button
                variant="contained"
                color="error"
                size="small"
                sx={{
                  paddingX: customStyles.consButton?.paddingX,
                  paddingY: customStyles.consButton?.paddingY,
                  ...customStyles.consButton,
                  ...getElementStyle("consButton"),
                }}
              >
                View cons and pros
              </Button>
            </Box>
          )
        );

      case "colors":
        return (
          template.showColors && (
            <Box
              key="colors"
              sx={{ position: "relative", ...getElementStyle("colors") }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection:
                    template.colorsLayout === "horizontal" ? "row" : "column",
                  gap: parseInt(getElementStyle("colors").gap) + "px" || 0.5,
                  alignItems: "center",
                }}
              >
                {colorCircles?.map((color, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: parseInt(template.colorSize) || 30,
                      height: parseInt(template.colorSize) || 30,
                      backgroundColor: color,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.5)",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )
        );

      default:
        return null;
    }
  };

  return (
    <Card sx={{ ...cardStyle, ...(isEditItem && { maxWidth: 350 }) }}>
      {/* Background Image Layer */}
      <Box sx={backgroundImageStyle} />

      {/* Overlay Layer */}
      <Box sx={overlayStyle} />

      {/* Content Layer */}
      <Box sx={contentStyle}>
        {layout
          .map((elementType) => renderElement(elementType))
          .filter(Boolean)}
      </Box>
    </Card>
  );
};

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
          <Grid item>
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
        <Grid item xs={12} sm={6}>
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
        {type === "COLOR_PATTERN" && key === "card" ? null : (
          <Grid item xs={12} sm={6}>
            <EnhancedSlider
              label="Border Radius"
              value={styles.borderRadius}
              onChange={(val) => handleUpdate("borderRadius", val, true)}
              min={0}
              max={50}
            />
          </Grid>
        )}
        {/* --- Shadow Section --- */}
        <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
                <EnhancedSlider
                  label="Color Circle Size"
                  value={template.colorSize}
                  onChange={(val) => onTemplateChange("colorSize", val)}
                  min={10}
                  max={100}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <EnhancedSlider
                  label="Color Circle gap"
                  value={styles.gap || 0.5}
                  onChange={(val) => handleUpdate("gap", val, true)}
                  min={10}
                  max={100}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        {key !== "card" && (
          <Grid item xs={12}>
            <Typography variant="overline">Typography</Typography>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} sm={6}>
                <EnhancedSlider
                  label="Font Size"
                  value={styles.fontSize}
                  onChange={(val) => handleUpdate("fontSize", val, true)}
                  min={10}
                  max={48}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
        )}

        {/* --- Spacing Section --- */}
        <Grid item xs={12}>
          <Typography variant="overline">Spacing</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <EnhancedSlider
            label="Padding X (Horizontal)"
            value={styles.paddingX}
            onChange={(val) => handleUpdate("paddingX", val, true)}
            min={0}
            max={100}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <EnhancedSlider
            label="Padding Y (Vertical)"
            value={styles.paddingY}
            onChange={(val) => handleUpdate("paddingY", val, true)}
            min={0}
            max={100}
          />
        </Grid>
        {key !== "card" && (
          <>
            <Grid item xs={6} sm={3}>
              <EnhancedSlider
                label="Margin Top"
                value={styles.marginTop}
                onChange={(val) => handleUpdate("marginTop", val, true)}
                min={0}
                max={100}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <EnhancedSlider
                label="Margin Bottom"
                value={styles.marginBottom}
                onChange={(val) => handleUpdate("marginBottom", val, true)}
                min={0}
                max={100}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <EnhancedSlider
                label="Margin Left"
                value={styles.marginLeft}
                onChange={(val) => handleUpdate("marginLeft", val, true)}
                min={0}
                max={100}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <EnhancedSlider
                label="Margin Right"
                value={styles.marginRight}
                onChange={(val) => handleUpdate("marginRight", val, true)}
                min={0}
                max={100}
              />
            </Grid>
          </>
        )}
      </Grid>
    );
  }
);

StyleEditorControls.displayName = "StyleEditorControls";

/**
 * Refactored style editor component with improved performance and UX.
 */
const StyleEditor = ({
  template,
  customStyles,
  onStyleChange,
  setTemplate,
  handleTemplateChange,
  type,
}) => {
  const visibleElements = useMemo(
    () =>
      [
        { key: "card", label: "Card Container" },
        { key: "title", label: "Title", visible: template.showTitle },
        {
          key: "description",
          label: "Description",
          visible: template.showDescription,
        },
        { key: "consButton", label: "Cons Button", visible: template.showCons },
        { key: "colors", label: "Colors", visible: template.showColors },
      ].filter((element) => element.visible !== false),
    [template]
  );

  const handleStyleUpdate = useCallback(
    (elementKey, property, value) => {
      onStyleChange((prevStyles) => ({
        ...prevStyles,
        [elementKey]: {
          ...prevStyles[elementKey],
          [property]: value,
        },
      }));
    },
    [onStyleChange]
  );

  return (
    <Box>
      {visibleElements.map((element) => (
        <Accordion
          key={element.key}
          sx={{ mb: 1 }}
          TransitionProps={{ unmountOnExit: true }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <Style sx={{ mr: 1, verticalAlign: "middle" }} />
              {element.label}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <StyleEditorControls
              element={element}
              customStyles={customStyles}
              onStyleUpdate={handleStyleUpdate}
              template={template}
              onTemplateChange={handleTemplateChange}
              setTemplate={setTemplate}
              type={type}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
// Main template editor component
const TemplateEditor = ({ onSave, initialTemplate, type, isEdit }) => {
  const [file, setFile] = useState();
  const customTemplate = {
    type,
    order: 1,
    showTitle: true,
    showImage: true,
    showCons: true,
    showColors: type === "COLOR_PATTERN",
    showDescription: true,
    showOverlay: true,
    isArchived: false,
    blurValue: 2,
    colorsLayout: "vertical",
    backgroundImage:
      "https://panel.dreamstudiio.com/uploads/26c284e5-d1b0-4047-87fe-74d77f80844e.jpg",
    overlayColor: "#000000",
    overlayOpacity: 0.3,
    borderRadius: type === "COLOR_PATTERN" ? "0px" : "8px",
    padding: "16px",
    paddingX: "16px",
    paddingY: "16px",
    colorSize: 35,
    customStyle: null,
  };
  const customStyle = {
    card: {
      backgroundColor: "transparent",
      borderRadius: type === "COLOR_PATTERN" ? "0px" : "8px",
      padding: "0px",
      paddingX: "0px",
      paddingY: "0px",
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      shadowColor: "rgba(0,0,0,0.1)",
    },
    title: {
      color: colors.primary,
      marginBottom: "8px",
    },
    description: {
      color: colors.secondary,
      marginBottom: "16px",
    },
    consButton: {
      marginBottom: "16px",
      paddingX: "16px",
      paddingY: "8px",
      backgroundColor: colors.primary,
      marginTop: "16px",
    },
    ...(type === "COLOR_PATTERN" && {
      colors: {
        marginBottom: "0px",
      },
    }),
  };
  const [template, setTemplate] = useState(
    initialTemplate ? initialTemplate : customTemplate
  );

  const [customStyles, setCustomStyles] = useState(
    initialTemplate ? initialTemplate.customStyle : customStyle
  );
  const [layout, setLayout] = useState([
    "title",
    "description",
    ...(type === "COLOR_PATTERN" ? ["colors"] : []),
    "consButton",
  ]);
  const debouncedTemplate = useDebounce(template, 500);
  const debouncedCustomStyles = useDebounce(customStyles, 500);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const { setLoading } = useToastContext();
  const { setAlertError } = useToastContext();
  const handleToggleField = useCallback((field) => {
    setTemplate((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const handleBlurChange = useCallback((_, value) => {
    setTemplate((prev) => ({ ...prev, blurValue: value }));
  }, []);

  const handleStyleChange = useCallback((newStyles) => {
    setCustomStyles(newStyles);
  }, []);

  const handleTemplateChange = useCallback((field, value) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
  }, []);
  useEffect(() => {
    if (file) {
      handleImageUpload();
    }
  }, [file]);
  const handleImageUpload = async () => {
    const formData = new FormData();
    formData.append("file", file.file);

    const uploadResponse = await handleRequestSubmit(
      formData,
      setLoading,
      "utility/upload",
      true,
      "Uploading file"
    );
    if (uploadResponse.status !== 200) {
      setAlertError("Error uploading file");
      return;
    }
    setFile(null);
    handleTemplateChange("backgroundImage", uploadResponse.fileUrls.file[0]);
  };

  const handleSave = async () => {
    const templateData = {
      ...template,
      customStyle: customStyles,
      layout: layout,
    };
    let url = `admin/image-session/templates`;
    if (isEdit) {
      url = url + `/${template.id}`;
    }
    const req = await handleRequestSubmit(
      templateData,
      setLoading,
      url,
      false,
      "Updating",
      false,
      isEdit ? "PUT" : "POST"
    );
    if (req.status === 200) {
      await onSave();
      setSaveMessage("Template saved successfully!");
      setShowSaveMessage(true);
      setDialogOpen(false);
    }
  };

  // Load functionality
  const handleLoad = (templateData) => {
    if (templateData) {
      setTemplate({
        ...template,
        ...templateData,
        customStyle: null,
      });

      if (templateData.customStyle) {
        setCustomStyles(templateData.customStyle);
      }

      if (templateData.layout) {
        setLayout(templateData.layout);
      }
      setSaveMessage("Template loaded successfully!");
      setShowSaveMessage(true);
    }
  };

  // Auto-load on component mount
  useEffect(() => {
    const savedTemplate = localStorage.getItem("currentTemplate");
    if (savedTemplate) {
      try {
        const templateData = JSON.parse(savedTemplate);
        handleLoad(templateData);
      } catch (error) {
        console.error("Error loading saved template:", error);
      }
    }
  }, []);

  if (!dialogOpen) {
    return (
      <Box sx={{ display: "flex", gap: 2, my: 1.5 }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setDialogOpen(true)}
          startIcon={<Tune />}
        >
          Configure Template
        </Button>
      </Box>
    );
  }
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Template Configuration</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  display: "flex",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom align="center">
                    Preview
                  </Typography>
                  <PreviewTemplateCard
                    template={debouncedTemplate} // Use debounced value
                    customStyles={debouncedCustomStyles} // Use debounced value
                    layout={layout}
                    onToggleVisibility={handleToggleField}
                    isEditMode={false}
                  />

                  {/* Layout Editor */}
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Layout Configuration
                  </Typography>
                  <LayoutEditor layout={layout} onLayoutChange={setLayout} />
                </Paper>
              </Box>
            </Grid>

            {/* Settings Panel */}
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                <Tune sx={{ mr: 1, verticalAlign: "middle" }} />
                Display Settings
              </Typography>

              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.showTitle}
                      onChange={() => handleToggleField("showTitle")}
                    />
                  }
                  label="Show Title"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.showDescription}
                      onChange={() => handleToggleField("showDescription")}
                    />
                  }
                  label="Show Description"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={template.showCons}
                      onChange={() => handleToggleField("showCons")}
                    />
                  }
                  label="Show Cons Button"
                />
                {type === "COLOR_PATTERN" && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={template.showColors}
                        onChange={() => handleToggleField("showColors")}
                      />
                    }
                    label="Show Colors"
                  />
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Background Settings
              </Typography>

              <Box>
                <Box sx={{ mb: 2 }}>
                  <SimpleFileInput
                    label="File"
                    id="file"
                    variant="outlined"
                    setData={setFile}
                  />
                </Box>

                <TextField
                  label="Or Enter Image URL"
                  value={template.backgroundImage || ""}
                  onChange={(e) =>
                    handleTemplateChange("backgroundImage", e.target.value)
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Box>
              <ColorPicker
                label="Background Color"
                value={customStyles.card.backgroundColor}
                onChange={(color) => handleBgColorChange(color)}
              />

              {/* Overlay Settings */}
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Overlay Settings
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={template.showOverlay}
                    onChange={() => handleToggleField("showOverlay")}
                  />
                }
                label="Enable Overlay"
                sx={{ mb: 2 }}
              />

              {template.showOverlay && (
                <Box sx={{ mb: 2 }}>
                  <ColorPicker
                    label="Overlay Color"
                    value={template.overlayColor}
                    onChange={(color) =>
                      handleTemplateChange("overlayColor", color)
                    }
                  />

                  <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                    Overlay Opacity: {Math.round(template.overlayOpacity * 100)}
                    %
                  </Typography>

                  <Slider
                    value={template.overlayOpacity}
                    onChange={(_, value) =>
                      handleTemplateChange("overlayOpacity", value)
                    }
                    min={0}
                    max={1}
                    step={0.1}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                  />
                </Box>
              )}

              <Typography variant="body2" gutterBottom>
                Image Blur: {template.blurValue}px
              </Typography>
              <Slider
                value={template.blurValue}
                onChange={handleBlurChange}
                min={0}
                max={30}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <Typography variant="h6" gutterBottom>
                <Style sx={{ mr: 1, verticalAlign: "middle" }} />
                Custom Styling
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Customize each visible element
              </Typography>

              <StyleEditor
                template={template}
                customStyles={customStyles}
                onStyleChange={handleStyleChange}
                setTemplate={setTemplate}
                handleTemplateChange={handleTemplateChange}
                type={type}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
            Save Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Success Message */}
      <Snackbar
        open={showSaveMessage}
        autoHideDuration={3000}
        onClose={() => setShowSaveMessage(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setShowSaveMessage(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {saveMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TemplateEditor;
