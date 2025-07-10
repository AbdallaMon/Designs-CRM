import React from "react";
import LanguageSelector from "@/app/UiComponents/utility/LanguageSelector";
import {
  AppBar,
  Toolbar,
  Box,
  useTheme,
  Avatar,
  Typography,
  Container,
  Button,
  Fab,
  Zoom,
} from "@mui/material";
import { MdArrowBack, MdArrowForward } from "react-icons/md";
import { useLanguageSwitcherContext } from "@/app/providers/LanguageSwitcherProvider";

export function ClientImageAppBar() {
  const theme = useTheme();
  const { lng } = useLanguageSwitcherContext();
  const label = lng === "ar" ? "دريم استوديو" : "Dream studio";
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        my: 1,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        boxShadow: `0 8px 32px ${theme.palette.primary.main}20`,
        border: `1px solid ${theme.palette.primary.light}30`,
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, transparent 50%, ${theme.palette.secondary.main}10 100%)`,
          borderRadius: "inherit",
          pointerEvents: "none",
        },
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* Logo Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                position: "relative",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.light})`,
                  borderRadius: "50%",
                  zIndex: -1,
                  opacity: 0.3,
                },
              }}
            >
              <Avatar
                src="https://dreamstudiio.com/dream-logo.jpg"
                alt={`${label} logo`}
                sx={{
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  border: `2px solid ${theme.palette.common.white}`,
                  boxShadow: `0 4px 12px ${theme.palette.common.black}20`,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: `0 6px 16px ${theme.palette.common.black}30`,
                  },
                }}
              />
            </Box>

            {/* Optional: Add company name/title */}
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                color: theme.palette.primary.contrastText,
                letterSpacing: "0.5px",
                textShadow: `0 2px 4px ${theme.palette.common.black}20`,
                display: { xs: "none", sm: "block" },
                background: `linear-gradient(135deg, ${theme.palette.common.white}, ${theme.palette.grey[200]})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {label}
            </Typography>
          </Box>

          {/* Language Selector Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              "& > *": {
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              },
            }}
          >
            <LanguageSelector />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export function ActionButtons({ session, handleNext, handleBack, disabled }) {
  const { lng } = useLanguageSwitcherContext();
  const isRTL = lng === "ar";
  const nextLabel = isRTL ? "التالي" : "Go Next";
  const backLabel = isRTL ? "السابق" : "Go Back";

  return (
    <Box display="flex" gap={2} justifyContent="space-between">
      {session && session.sessionStatus !== "INITIAL" && (
        <ActionButton
          disabled={disabled}
          handleClick={handleBack}
          type={"BACK"}
          label={backLabel}
        />
      )}
      <ActionButton
        disabled={disabled}
        handleClick={handleNext}
        type={"NEXT"}
        label={nextLabel}
      />
    </Box>
  );
}

export function ActionButton({
  disabled,
  handleClick,
  type,
  label,
  variant = "contained",
}) {
  const theme = useTheme();

  return (
    <Button
      variant={variant}
      size="medium"
      onClick={() => {
        if (handleClick) {
          handleClick();
        }
      }}
      disabled={disabled}
      endIcon={type === "NEXT" ? <MdArrowForward /> : <MdArrowBack />}
      sx={{
        borderRadius: 25,
        fontSize: "1.1rem",
        fontWeight: 600,
        textTransform: "none",
        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        boxShadow: `0 8px 20px ${theme.palette.primary.main}40`,
        border: `2px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.contrastText,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
          transform: "translateY(-2px)",
          boxShadow: `0 12px 24px ${theme.palette.primary.main}50`,
        },
        "&:active": {
          transform: "translateY(0)",
        },
      }}
    >
      {label}
    </Button>
  );
}
export function FloatingActionButton({
  disabled,
  handleClick,
  type,
  sx,
  isText,
  label,
  variant = "outlined",
  isOverItems,
}) {
  const theme = useTheme();
  const Icon = type === "NEXT" ? MdArrowForward : MdArrowBack;

  const transitionDuration = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen,
  };
  return (
    <Zoom in={true} timeout={transitionDuration} unmountOnExit>
      <Fab
        onClick={handleClick}
        disabled={disabled}
        color="primary"
        sx={
          sx
            ? sx
            : {
                ...(isText && {
                  width: "fit-content",
                  height: "fit-content",
                }),
                position: "fixed",
                bottom: "15px",
                right: "15px",
                ...(isOverItems && { zIndex: 1500 }),
              }
        }
      >
        {isText ? (
          <ActionButton
            disabled={disabled}
            label={label}
            type={type}
            variant={variant}
          />
        ) : (
          <Icon size={18} />
        )}
      </Fab>
    </Zoom>
  );
}
