"use client";
import { createTheme, ThemeProvider } from "@mui/material";

import colors from "@/app/helpers/colors";
const generateMuiShadows = (baseShadowColor, darkShadowColor) => {
  const shadows = ["none"]; // Elevation 0 is always 'none'

  // Manually define first few subtle shadows, similar to MUI's defaults
  shadows.push(`0px 1px 2px ${baseShadowColor}`); // Elevation 1
  shadows.push(
    `0px 1px 3px ${baseShadowColor}, 0px 2px 5px ${baseShadowColor}`
  ); // Elevation 2
  shadows.push(
    `0px 2px 4px ${baseShadowColor}, 0px 4px 8px ${baseShadowColor}`
  ); // Elevation 3
  shadows.push(
    `0px 3px 5px ${baseShadowColor}, 0px 6px 10px ${baseShadowColor}`
  ); // Elevation 4

  // Generate remaining shadows with increasing intensity
  for (let i = 5; i <= 24; i++) {
    const yOffset = Math.floor(i * 0.7);
    const blur = Math.floor(i * 1.5);
    const spread = Math.floor(i * 0.2);
    const opacity = 0.05 + i * 0.015; // Progressive increase in opacity
    const currentShadowColor = `rgba(${parseInt(
      darkShadowColor.slice(5, 7),
      16
    )}, ${parseInt(darkShadowColor.slice(7, 9), 16)}, ${parseInt(
      darkShadowColor.slice(9, 11),
      16
    )}, ${opacity.toFixed(2)})`;

    shadows.push(
      `0px ${yOffset}px ${blur}px ${spread}px ${currentShadowColor}`
    );
  }
  return shadows;
};
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: colors.textOnPrimary,
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: colors.textOnSecondary,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textMuted,
    },
    background: {
      default: colors.body,
      paper: colors.paperBg,
    },
    common: {
      white: "#ffffff",
      black: colors.heading,
    },
    action: {
      hover: colors.primaryAlt,
      selected: colors.highlight,
      disabled: colors.textMuted,
      disabledBackground: colors.bgTertiary,
    },
    error: {
      main: colors.error,
      light: colors.errorLight,
      dark: colors.errorDark,
      contrastText: "#ffffff",
    },
    warning: {
      main: colors.warning,
      light: colors.warningLight,
      dark: colors.warningDark,
      contrastText: "#ffffff",
    },
    info: {
      main: colors.info,
      light: colors.infoLight,
      dark: colors.infoDark,
      contrastText: "#ffffff",
    },
    success: {
      main: colors.success,
      light: colors.successLight,
      dark: colors.successDark,
      contrastText: "#ffffff",
    },
    divider: colors.border,
    // Custom colors
    gradient: {
      primary: colors.primaryGradient,
    },
  },
  zIndex: {
    modal: 1300,
    snackbar: 1500,
    tooltip: 1600,
    appBar: 1100,
    drawer: 1200,
  },
  typography: {
    fontFamily: ["Noto Kufi Arabic", "system-ui", "sans-serif"].join(","),
    h1: {
      color: colors.heading,
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h2: {
      color: colors.heading,
      fontWeight: 600,
      fontSize: "2rem",
      lineHeight: 1.3,
    },
    h3: {
      color: colors.heading,
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.4,
    },
    h4: {
      color: colors.heading,
      fontWeight: 500,
      fontSize: "1.25rem",
    },
    h5: {
      color: colors.textPrimary,
      fontWeight: 500,
      fontSize: "1.1rem",
    },
    h6: {
      color: colors.textPrimary,
      fontWeight: 500,
      fontSize: "1rem",
    },
    body1: {
      color: colors.textPrimary,
      fontSize: "1rem",
      lineHeight: 1.6,
    },
    body2: {
      color: colors.textSecondary,
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    caption: {
      color: colors.textTertiary,
      fontSize: "0.75rem",
    },
    overline: {
      color: colors.textMuted,
      fontSize: "0.625rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
      xxl: 1920,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: generateMuiShadows(colors.shadow, colors.shadowDark),
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: "xxl",
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paperBg,
          backgroundImage: "none",
        },
        elevation1: {
          backgroundColor: colors.surfaceElevated,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paperBg,
          borderRadius: 12,
          boxShadow: `0 2px 8px ${colors.shadow}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 500,
        },
        contained: {
          boxShadow: `0 2px 4px ${colors.shadow}`,
          "&:hover": {
            boxShadow: `0 4px 8px ${colors.shadowDark}`,
          },
        },
        outlined: {
          borderColor: colors.border,
          "&:hover": {
            borderColor: colors.primary,
            backgroundColor: colors.primaryAlt,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: colors.bgSecondary,
            "& fieldset": {
              borderColor: colors.border,
            },
            "&:hover fieldset": {
              borderColor: colors.borderDark,
            },
            "&.Mui-focused fieldset": {
              borderColor: colors.primary,
            },
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          color: colors.textSecondary,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.paperBg,
          color: colors.textPrimary,
          boxShadow: `0 1px 3px ${colors.shadow}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.bgPrimary,
          borderRight: `1px solid ${colors.border}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.border,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: colors.bgTertiary,
          color: colors.textPrimary,
        },
        colorPrimary: {
          backgroundColor: colors.primaryAlt,
          color: colors.primary,
        },
      },
    },
  },
});

export default function MUIContextProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
