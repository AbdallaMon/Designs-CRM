import { createTheme } from "@mui/material";
import colors from "@/app/v2/lib/theme/colors";
import statusPalette from "./statusTokens";

const generateMuiShadows = (baseShadowColor, darkShadowColor) => {
  const shadows = ["none"];

  shadows.push(`0px 1px 2px ${baseShadowColor}`);
  shadows.push(
    `0px 1px 3px ${baseShadowColor}, 0px 2px 5px ${baseShadowColor}`,
  );
  shadows.push(
    `0px 2px 4px ${baseShadowColor}, 0px 4px 8px ${baseShadowColor}`,
  );
  shadows.push(
    `0px 3px 5px ${baseShadowColor}, 0px 6px 10px ${baseShadowColor}`,
  );

  for (let i = 5; i <= 24; i++) {
    const yOffset = Math.floor(i * 0.7);
    const blur = Math.floor(i * 1.5);
    const spread = Math.floor(i * 0.2);
    const opacity = 0.05 + i * 0.015;
    const currentShadowColor = `rgba(${parseInt(
      darkShadowColor.slice(5, 7),
      16,
    )}, ${parseInt(darkShadowColor.slice(7, 9), 16)}, ${parseInt(
      darkShadowColor.slice(9, 11),
      16,
    )}, ${opacity.toFixed(2)})`;

    shadows.push(
      `0px ${yOffset}px ${blur}px ${spread}px ${currentShadowColor}`,
    );
  }
  return shadows;
};

const theme = createTheme({
  // RTL is produced by the emotion cache's stylis rtl plugin (see RtlCacheProvider),
  // NOT by the theme. Mirrored from the working reference project, the theme direction
  // is deliberately kept "ltr" so MUI does not flip its own logical properties a second
  // time on top of the stylis transform (which would cancel out to LTR). The <html dir>
  // is "rtl" (root layout) and the visual result is RTL. Looks counter-intuitive but is
  // exactly how the reference's working RTL is wired.
  direction: "ltr",
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: colors.textOnPrimary,
      // Accessible token for the brand color as TEXT on a light surface (the caramel `main`
      // fails 4.5:1 on white). Read this via theme.palette.primary.textOnLight; `main` stays
      // for fills/accents only. (UX plan §2 a11y.)
      textOnLight: colors.primaryTextOnLight,
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
    gradient: {
      primary: colors.primaryGradient,
    },
    // One source of truth for status colors (folds legacy STATUS_COLORS / NotificationColors /
    // contractLevelColors). Read by <StatusChip status domain> — see providers/statusTokens.js.
    status: statusPalette,
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
    // Respect the OS "reduce motion" preference globally — kills our hover transitions (and any
    // MUI transitions) for users who ask for it. Light, no layout-shifting animation anywhere.
    MuiCssBaseline: {
      styleOverrides: {
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            transitionDuration: "0.01ms !important",
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            scrollBehavior: "auto !important",
          },
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: "xxl",
      },
    },
    MuiPaper: {
      styleOverrides: {
        // Softer modern radius — `rounded` (not `root`) so square/0-radius Paper variants and the
        // AppBar/Drawer surfaces are unaffected; SectionCard/ChartCard (Paper-based) inherit it.
        rounded: {
          borderRadius: 16,
        },
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
          borderRadius: 16,
          boxShadow: `0 2px 8px ${colors.shadow}`,
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        // Subtle hover feedback for every clickable base (buttons, list items, tabs). No
        // layout-shift — only color/background/shadow ease. Self-guarded with a media query so it
        // respects "reduce motion" even if MuiCssBaseline isn't mounted (it currently isn't).
        root: {
          transition:
            "background-color 160ms ease, color 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: "background-color 160ms ease, color 160ms ease, border-color 160ms ease",
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
          },
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
    // Scrollable Tabs scroll arrows (lead-detail tabs, UrlTabs, accounting tabs). MUI's default
    // disabled scroll button keeps `opacity: 0` but STILL occupies its 40px and stays in the DOM.
    // Under RTL that invisible phantom sits at the inline-start (visual right) and silently swallows
    // clicks/space — making the strip feel like "the arrow does nothing". Collapsing the disabled
    // button to display:none removes the dead hit-area and lets the live arrow (and the tabs behind
    // the phantom) take the click. Direction-agnostic and safe — only affects the already-invisible
    // disabled state. RTL scroll-delta is handled by the emotion rtl stylis plugin + <html dir="rtl">
    // (the theme direction itself is kept "ltr" to avoid a double-flip — see the note at theme top).
    MuiTabScrollButton: {
      styleOverrides: {
        root: {
          "&.Mui-disabled": {
            display: "none",
          },
        },
      },
    },
  },
});

export default theme;
