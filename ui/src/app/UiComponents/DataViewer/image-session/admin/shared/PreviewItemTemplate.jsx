"use client";
import { Box, Button, Card, IconButton, Typography } from "@mui/material";
import { MdVisibilityOff } from "react-icons/md";
import ProsAndConsDialogButton from "./ProsAndCons";

export function PreviewItemTemplate({ template, item }) {
  const customStyles = template.customStyle;
  const cardDimensions = { minWidth: "300px", width: "100%" };
  const cardStyle = {
    position: "relative",
    ...cardDimensions,
    margin: "0 auto",
    backgroundColor: template.backgroundColor || "#f5f5f5",
    borderRadius: template.borderRadius || "8px",
    overflow: "hidden",
    ...customStyles.card,
    maxWidth: "300px",
    mx: "auto",
  };

  // Background image with blur (separate from content)
  const backgroundImageStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: item.imageUrl
      ? item.imageUrl
      : template.backgroundImage
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
  const colorCircles = item.colors; //todo
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
                {item.title[0].text}
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

                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-all",
                }}
              >
                {item.description.length > 0 && item.description[0].content}
              </Typography>
            </Box>
          )
        );

      case "consButton":
        return (
          template.showCons && (
            <Box key="consButton">
              <ProsAndConsDialogButton
                customStyle={{
                  paddingX: customStyles.consButton?.paddingX,
                  paddingY: customStyles.consButton?.paddingY,
                  ...customStyles.consButton,
                  ...getElementStyle("consButton"),
                }}
              />
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
                  gap: 0.5,
                  alignItems: "center",
                }}
              >
                {colorCircles?.map((color, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: template.colorSize || 30,
                      height: template.colorSize || 30,

                      backgroundColor: color,
                      borderRadius: "50%",
                      border: "2px solid rgba(255,255,255,0.5)",
                    }}
                  />
                ))}
              </Box>
              {isEditMode && (
                <IconButton
                  size="small"
                  sx={{ position: "absolute", top: -8, right: -8 }}
                  onClick={() => onToggleVisibility("showColors")}
                >
                  <MdVisibilityOff fontSize="small" />
                </IconButton>
              )}
            </Box>
          )
        );

      default:
        return null;
    }
  };

  return (
    <Card sx={{ ...cardStyle }}>
      {/* Background Image Layer */}
      <Box sx={backgroundImageStyle} />

      {/* Overlay Layer */}
      <Box sx={overlayStyle} />

      {/* Content Layer */}
      <Box sx={contentStyle}>
        {template.layout
          .map((elementType) => renderElement(elementType))
          .filter(Boolean)}
      </Box>
    </Card>
  );
}
