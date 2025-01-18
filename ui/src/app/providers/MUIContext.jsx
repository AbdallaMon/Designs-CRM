"use client";
import { createTheme, ThemeProvider } from "@mui/material";

import colors from "@/app/helpers/colors";

const theme = createTheme({
    palette: {
        primary: {
            main: colors.primary,
            light: colors.primaryAlt,
            dark: colors.primaryDark,
            contrastText: '#ffffff',
        },
        secondary: {
            main: colors.secondary,
            contrastText: colors.secondaryText,
        },
        text: {
            primary: colors.textColor,
            secondary: colors.heading,
            white:"#ffffff",
            disabled: colors.textColor,
        },
        background: {
            default: colors.body,
            paper: colors.paperBg,
        },
        common: {
            white: colors.bgPrimary,
        },
        action: {
            hover: colors.primaryAlt,
            selected: colors.bgSecondary,
        },
        gradient: {
            primary: colors.primaryGradient,
        },
    },
    zIndex: {
        modal: 1300,
        snackbar: 1500,
    },
    typography: {
        fontFamily: ["Noto Kufi Arabic", "sans-serif"].join(","),
        // You can also customize typography colors
        h1: {
            color: colors.heading,
        },
        h2: {
            color: colors.heading,
        },
        h3: {
            color: colors.heading,
        },
        body1: {
            color: colors.textColor,
        },
        body2: {
            color: colors.secondaryText,
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
    components: {
        MuiContainer: {
            defaultProps: {
                maxWidth: "xxl",
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundColor: colors.bgPrimary,
                },
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: {
                    color: colors.textColor, // Set default icon color to textColor
                },
            },
        },
    },
});


export default function MUIContextProvider({ children }) {
    return (

              <ThemeProvider theme={theme}>
                  {children}
              </ThemeProvider>
    );
}