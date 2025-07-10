import {
  Box,
  Button,
  Card,
  ClickAwayListener,
  IconButton,
  Typography,
} from "@mui/material";
import ProsAndConsDialogButton from "../admin/shared/ProsAndCons";
import { ensureHttps } from "@/app/helpers/functions/utility";
import {
  MdCheckCircle,
  MdEdit,
  MdFullscreen,
  MdRadioButtonUnchecked,
} from "react-icons/md";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "../admin/shared/CreateTitleOrDesc";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import gsap from "gsap";
import { HexColorPicker } from "react-colorful";

export function PreviewItem({
  template,
  item,
  customColors,
  setCustomColors,
  isEditMode,
  type,
  canSelect,
  isSelected,
  onSelect,
  extraLng,
  animated,
  currentCard,
  loading,
  hidden,
  height,
}) {
  const [colorPickerOpen, setColorPickerOpen] = useState(null); // Store the color ID being edited
  const [tempColorValue, setTempColorValue] = useState("");
  const colorInputRef = useRef(null);
  const colorsRef = useRef();
  const debouncedColorValue = useDebounce(tempColorValue, 300);

  const customStyles = template.customStyle;
  const cardDimensions = { width: "100%" };
  const cardStyle = {
    position: "relative",
    ...cardDimensions,
    margin: "0 auto",
    backgroundColor: template.backgroundColor || "#f5f5f5",
    borderRadius: template.borderRadius || "8px",
    overflow: "hidden",
    ...customStyles.card,
    mx: "auto",
    opacity: hidden ? 0 : 1,
    height: height && height,
  };

  // Background image with blur (separate from content)
  const backgroundImageStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: item.imageUrl
      ? `url(${ensureHttps(item.imageUrl)})`
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
    const numericSize = parseInt(baseStyle.fontSize) || 16;
    const returnedData = {
      ...baseStyle,
      marginTop: baseStyle.marginTop || "0px",
      marginBottom: baseStyle.marginBottom || "8px",
      marginLeft: baseStyle.marginLeft || "0px",
      marginRight: baseStyle.marginRight || "0px",
    };
    if (elementType === "title") {
      returnedData.fontSize = numericSize + "px";
    }
    return returnedData;
  };

  const colorCircles =
    customColors && customColors.length > 0 && isEditMode
      ? customColors
      : item.colors;

  // Handle debounced color changes
  useEffect(() => {
    if (debouncedColorValue && colorPickerOpen && setCustomColors) {
      setCustomColors((prevColors) =>
        prevColors.map((color) =>
          color.id === colorPickerOpen
            ? { ...color, colorHex: debouncedColorValue }
            : color
        )
      );
    }
  }, [debouncedColorValue, colorPickerOpen, setCustomColors]);
  useEffect(() => {
    if (animated && currentCard && !loading) {
      const colorsSizes = currentCard.querySelectorAll(".color-circle");
      gsap.fromTo(
        colorsSizes,
        {
          opacity: 0,
          y: 15,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
          stagger: 0.05,
        }
      );
    }
  }, [animated, colorsRef?.current, loading]);
  const handleColorChange = (newHex) => {
    setTempColorValue(newHex);
  };

  const handleColorPickerOpen = (colorId) => {
    const currentColor = colorCircles.find((color) => color.id === colorId);
    setTempColorValue(currentColor?.colorHex || "#000000");
    setColorPickerOpen(colorId);

    // Open the color picker directly
    setTimeout(() => {
      if (colorInputRef.current) {
        colorInputRef.current.click();
      }
    }, 0);
  };

  const handleColorPickerClose = () => {
    setColorPickerOpen(null);
    setTempColorValue("");
  };

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
                  ...customStyles.title,
                  textAlign: "center !important",
                }}
              >
                {item.title.length > 0 &&
                  (extraLng
                    ? item.title?.find(
                        (desc) => desc.language?.code === extraLng
                      ).text
                    : item.title[0].text)}
              </Typography>
            </Box>
          )
        );

      case "description":
        return (
          template.showDescription && (
            <Box
              key="description"
              className="description"
              sx={{
                opacity: animated ? 0 : 1,
                position: "relative",
                ...getElementStyle("description"),
                maxWidth: "600px",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  ...customStyles.description,
                  textAlign: "center !important",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  wordBreak: "break-all",
                  mx: "auto",
                }}
              >
                {item.description.length > 0 &&
                  (extraLng
                    ? item.description?.find(
                        (desc) => desc.language?.code === extraLng
                      )?.content
                    : item.description[0].content)}
              </Typography>
            </Box>
          )
        );

      case "consButton":
        return (
          template.showCons && (
            <Box key="consButton">
              <ProsAndConsDialogButton
                materialId={type === "MATERIAL" && item.id}
                styleId={type === "STYLE" && item.id}
                lng={lng}
              />
            </Box>
          )
        );

      case "colors":
        return (
          (template.showColors || animated) && (
            <Box
              key="colors"
              sx={{ position: "relative", ...getElementStyle("colors") }}
              ref={colorsRef}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection:
                    template.colorsLayout === "horizontal" ? "row" : "column",
                  gap: isEditMode
                    ? (parseInt(getElementStyle("colors").gap) || 5) + 5 + "px"
                    : getElementStyle("colors").gap || 1,
                  alignItems: "center",
                  position: "relative",
                }}
              >
                {colorCircles?.map((color, index) => (
                  <>
                    {colorPickerOpen === color.id && (
                      <ClickAwayListener
                        onClickAway={() => setColorPickerOpen(null)}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: "0",
                            left: 0,
                            zIndex: 100,
                            background: "#fff",
                            padding: 1,
                            boxShadow: 3,
                            borderRadius: 2,
                          }}
                        >
                          <HexColorPicker
                            color={tempColorValue}
                            onChange={(newColor) => handleColorChange(newColor)}
                          />
                        </Box>
                      </ClickAwayListener>
                    )}
                    <Box
                      className="color-circle"
                      key={index}
                      sx={{
                        position: "relative",
                        opacity: animated ? 0 : 1,
                        zIndex: 0,
                        width:
                          {
                            xs: template.colorSize,
                            md: template.colorSize + 5,
                          } || 40,
                        height:
                          {
                            xs: template.colorSize,
                            md: template.colorSize + 5,
                          } || 40,
                        backgroundColor: color.colorHex,
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.5)",
                      }}
                    >
                      {isEditMode && color.isEditableByClient && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleColorPickerOpen(color.id)}
                            sx={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              // width: 20,
                              // height: 20,
                              "&:hover": {
                                backgroundColor: "rgba(255, 255, 255, 1)",
                              },
                            }}
                          >
                            <MdEdit sx={{ fontSize: 12 }} />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </>
                ))}
              </Box>
            </Box>
          )
        );

      default:
        return null;
    }
  };
  const { lng } = useLanguageSwitcherContext();
  const label = isSelected
    ? lng === "ar"
      ? "تم الاختيار"
      : "Selected"
    : lng === "ar"
    ? "اختار"
    : "Select";
  return (
    <Card sx={{ ...cardStyle }}>
      {canSelect && (
        <Button
          variant={isSelected ? "contained" : "outlined"}
          color={isSelected ? "success" : "primary"}
          startIcon={
            isSelected ? <MdCheckCircle /> : <MdRadioButtonUnchecked />
          }
          onClick={() => onSelect(item)}
          sx={{
            borderColor: "white",
            color: isSelected ? "white" : "white",
            borderRadius: 3,
            px: 3,
            py: 1,
            position: "absolute",
            top: 15,
            right: 15,
            zIndex: 100,
            "&:hover": {
              borderColor: "white",
              bgcolor: isSelected ? "success.dark" : "rgba(255,255,255,0.1)",
              transform: "translateY(-2px)",
            },
          }}
        >
          {label}
        </Button>
      )}

      <Box sx={backgroundImageStyle} />
      <Box sx={overlayStyle} />
      <Box sx={contentStyle}>
        {template.layout
          .map((elementType) => renderElement(elementType))
          .filter(Boolean)}
      </Box>
    </Card>
  );
}
