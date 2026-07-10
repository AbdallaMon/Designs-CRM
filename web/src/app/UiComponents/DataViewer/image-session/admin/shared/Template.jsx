import React, { useState, useCallback, useEffect } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from "@mui/material";
import { MdStyle as Style, MdTune as Tune, MdSave as Save } from "react-icons/md";
import colors from "@/app/helpers/colors";
import SimpleFileInput from "@/app/UiComponents/formComponents/SimpleFileInput";
import { handleRequestSubmit } from "@/app/helpers/functions/handleSubmit";
import { useToastContext } from "@/app/providers/ToastLoadingProvider";
import { useDebounce } from "@/app/UiComponents/DataViewer/image-session/admin/shared/CreateTitleOrDesc.jsx";
import { useUploadContext } from "@/app/providers/UploadingProgressProvider";
import { uploadInChunks } from "@/app/helpers/functions/uploadAsChunk";
import ColorPicker from "@/app/UiComponents/DataViewer/image-session/admin/shared/template/ColorPicker.jsx";
import LayoutEditor from "@/app/UiComponents/DataViewer/image-session/admin/shared/template/LayoutEditor.jsx";
import StyleEditor from "@/app/UiComponents/DataViewer/image-session/admin/shared/template/StyleEditor.jsx";

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
    borderRadius: template.borderRadius || "0px",
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

// Main template editor component
const TemplateEditor = ({ onSave, initialTemplate, type, isEdit }) => {
  const [file, setFile] = useState();
  const { setProgress, setOverlay } = useUploadContext();

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
    borderRadius: type === "COLOR_PATTERN" ? "0px" : "0px",
    padding: "16px",
    paddingX: "16px",
    paddingY: "16px",
    colorSize: 35,
    customStyle: null,
  };
  const customStyle = {
    card: {
      backgroundColor: "transparent",
      borderRadius: type === "COLOR_PATTERN" ? "0px" : "0px",
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
    const fileUpload = await uploadInChunks(file.file, setProgress, setOverlay);
    if (fileUpload.status === 200) {
      setFile(null);
      handleTemplateChange("backgroundImage", fileUpload.url);
    }
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
            <Grid size={{ md: 5 }}>
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
            <Grid size={{ md: 7 }}>
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
                onChange={(color) =>
                  handleStyleChange(() => {
                    const newStyle = { ...customStyles };
                    newStyle.card = {
                      ...newStyle.card,
                      backgroundColor: color,
                    };
                    return newStyle;
                  })
                }
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
