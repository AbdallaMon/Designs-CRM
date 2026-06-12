"use client";
import { ThemeProvider } from "@mui/material";
import theme from "./theme";

export function MUIProvider({ children }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
