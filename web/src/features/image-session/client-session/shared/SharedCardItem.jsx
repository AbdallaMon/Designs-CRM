import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
} from "@mui/material";
import {
  MdCheckCircle,
  MdFullscreen,
  MdRadioButtonUnchecked,
} from "react-icons/md";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";
import { ensureHttps } from "@/app/helpers/functions/utility";
export function SharedCardItem({
  background = false,
  item,
  canSelect,
  isSelected,
  onSelect,
  hidden,
  height,
  isFullWidth,
  template,
  canPreview,
  handlePreviewClick,
}) {
  const customStyles = template.customStyle;
  const cardDimensions = { width: "100%" };
  const cardStyle = {
    position: "relative",
    ...cardDimensions,
    margin: "0 auto",
    backgroundColor: item.background || template.backgroundColor || "#f5f5f5",
    borderRadius: template.borderRadius || "0",
    overflow: "hidden",
    ...customStyles.card,
    mx: "auto",
    opacity: hidden ? 0 : 1,
    height: height && height + " !important",
  };

  // Background image with blur (separate from content)
  const backgroundImageStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: background
      ? ""
      : item.imageUrl
      ? `url(${ensureHttps(item.imageUrl)})`
      : template.backgroundImage
      ? `url(${template.backgroundImage})`
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: template.blurValue > 0 ? `blur(${template.blurValue}px)` : "none",
    background: item.background,
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

  const { lng } = useLanguageSwitcherContext();
  const label = isSelected
    ? lng === "ar"
      ? "تم الاختيار"
      : "Selected"
    : lng === "ar"
    ? "اختار"
    : "Select";
  const [word1, word2] = item.title[0].text.split(" ");

  return (
    <Card
      sx={{
        ...cardStyle,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 15,
          right: 15,
          zIndex: 100,
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        {canPreview && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handlePreviewClick(item);
            }}
            sx={{
              bgcolor: "rgba(0,0,0,0.7)",
              color: "white",
              width: 36,
              height: 36,

              transition: "all 0.3s ease",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.9)",
                transform: "scale(1.1)",
              },
            }}
            size="small"
          >
            <MdFullscreen size={18} />
          </IconButton>
        )}
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
      </Box>
      <CardContent
        sx={{
          width: "100%",
          height: "100%",
        }}
      >
        <Box sx={backgroundImageStyle} />
        <Box sx={overlayStyle} />
        <Box
          sx={{
            position: "absolute",
            bottom: isFullWidth ? "50%" : 16,
            left: isFullWidth ? "50%" : 16,
            transform: isFullWidth ? "translate(-50%, 50%)" : "none",
            textAlign: isFullWidth ? "center" : "right",
          }}
        >
          {isFullWidth ? (
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                color: "#fff",
                fontSize: "1.6rem",
                lineHeight: 1.3,
                ...customStyles.title,
              }}
            >
              {word1} {word2}
            </Typography>
          ) : (
            <>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "#fff",
                  fontSize: "1.6rem",
                  lineHeight: 1.3,
                  ...customStyles.title,
                }}
              >
                {word1}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "#fff",
                  fontSize: "1.6rem",
                  lineHeight: 1.3,
                  ...customStyles.title,
                }}
              >
                {word2}
              </Typography>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
