import { rgb } from "pdf-lib";

// Shared PDF colour palette. This exact palette was duplicated verbatim inside both
// PDF subsystems (contract + image-session); it is extracted here so both import one
// source of truth. Values are unchanged — behaviour-preserving.
export const PDF_COLORS = {
  primary: rgb(0.827, 0.675, 0.443),
  primaryDark: rgb(0.745, 0.592, 0.361),
  primaryLight: rgb(0.95, 0.92, 0.88),
  heading: rgb(0.22, 0.188, 0.157),
  textColor: rgb(0.345, 0.302, 0.247),
  bgPrimary: rgb(0.918, 0.906, 0.886),
  accentBg: rgb(0.98, 0.97, 0.95),
  success: rgb(0.518, 0.569, 0.471),
  borderColor: rgb(0.7, 0.7, 0.7),
  white: rgb(1, 1, 1),
  lightGray: rgb(0.95, 0.95, 0.95),
  shadowColor: rgb(0.85, 0.85, 0.85),
  red: rgb(1, 0, 0),
};
